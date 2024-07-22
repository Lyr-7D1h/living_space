use anyhow::{anyhow, Context};
use futures_util::{stream::IntoStream, FutureExt, SinkExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use tokio::net::TcpStream;
use tokio_tungstenite::{tungstenite, WebSocketStream};

pub type WSStream<'n> = IntoStream<WebSocketStream<&'n mut TcpStream>>;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Message {
    Error {
        message: String,
    },
    Init(ConnectionType),
    Id {
        id: String,
    },
    Config(Config),
    Create {
        position: Vec<u32>,
        color: Vec<u32>,
        personality: Personality,
    },
}

impl Message {
    pub fn error(message: &str) -> Self {
        Message::Error {
            message: message.to_string(),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "connection_type")]
#[serde(rename_all = "snake_case")]
pub enum ConnectionType {
    Canvas,
    Controller { id: String },
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Personality {
    openness: u32,
    conscientiousness: u32,
    extraversion: u32,
    agreeableness: u32,
    neuroticism: u32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Config {
    width: u32,
    height: u32,
}

pub struct MessageStream<'a> {
    stream: WSStream<'a>,
}
impl<'a> MessageStream<'a> {
    pub async fn new(stream: &'a mut TcpStream) -> anyhow::Result<Self> {
        let stream = tokio_tungstenite::accept_async(stream)
            .await
            .context("Error during the websocket handshake occurred")?
            .into_stream();

        Ok(MessageStream { stream })
    }

    pub async fn read_now(&mut self) -> anyhow::Result<Option<Message>> {
        if let Some(msg) = self.stream.try_next().now_or_never() {
            if let Some(message) = msg.context("error occurred while reading from stream")? {
                let message: Result<Message, serde_json::Error> = match message {
                    tungstenite::Message::Text(text) => serde_json::from_str(&text),
                    tungstenite::Message::Close(_) => return Err(anyhow!("closing")),
                    _ => return Err(anyhow!("invalid message data type")),
                };
                return Ok(Some(message?));
            }
        };
        return Ok(None);
    }

    pub async fn read(&mut self) -> anyhow::Result<Message> {
        let msg = self
            .stream
            .try_next()
            .await
            .context("error occurred while reading from stream")?
            .context("error occurred while reading from stream")?;
        let message: Message = match msg {
            tungstenite::Message::Text(text) => match serde_json::from_str(&text) {
                Ok(m) => m,
                Err(e) => {
                    self.send(Message::error("failed to parse message"))
                        .await
                        .context("failed to send message")?;
                    return Err(anyhow!("failed to parse message: {}", e));
                }
            },
            tungstenite::Message::Close(_) => return Err(anyhow!("closing")),
            _ => {
                self.send(Message::error("invalid message data type"))
                    .await
                    .context("failed to send message")?;
                return Err(anyhow!("invalid message data type"));
            }
        };
        Ok(message)
    }

    pub async fn send(&mut self, message: Message) -> anyhow::Result<()> {
        let value = serde_json::to_string(&message).context("failed to send message")?;
        self.stream
            .send(tungstenite::Message::Text(value))
            .await
            .context("failed to send message")?;
        Ok(())
    }
}
