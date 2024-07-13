use std::{sync::Arc, time::Duration};

use futures_util::{stream::IntoStream, FutureExt, SinkExt, TryStreamExt};
use log::{error, info};

use anyhow::{anyhow, Context, Result};

use serde::{Deserialize, Serialize};
use tokio::{
    net::{TcpListener, TcpStream, ToSocketAddrs},
    sync::{
        broadcast::{self, Receiver, Sender},
        Mutex,
    },
    time::sleep,
};
use tokio_tungstenite::{
    tungstenite::{self},
    WebSocketStream,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Message {
    Error {
        message: String,
    },
    Init {
        connection_type: ConnectionType,
    },
    Config(Config),
    Create {
        position: Vec<u32>,
        size: u32,
        color: Vec<u32>,
        personality: Personality,
    },
}
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionType {
    Canvas,
    Controller,
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

pub struct State {
    latest_config: Option<Config>,
}

pub struct Broadcaster {
    listener: TcpListener,
    state: Arc<Mutex<State>>,
}

impl Broadcaster {
    pub async fn bind<A: ToSocketAddrs>(addr: A) -> Result<Broadcaster> {
        let listener = TcpListener::bind(addr).await?;

        return Ok(Broadcaster {
            listener,
            state: Arc::new(Mutex::new(State {
                latest_config: None,
            })),
        });
    }

    pub async fn listen(self) -> Result<()> {
        info!("Listening on: {:?}", self.listener.local_addr()?);
        let (tx, rx) = broadcast::channel::<Message>(100);

        let mut handles = vec![];
        while let Ok((mut stream, _)) = self.listener.accept().await {
            let state = self.state.clone();
            let tx = tx.clone();
            let rx = tx.subscribe();
            let handle = tokio::spawn(async move {
                let (ws_stream, contype) = match init(&mut stream).await {
                    Ok(r) => r,
                    Err(e) => {
                        error!("Closing session to {:?}", stream.peer_addr());
                        error!("{e}");
                        return;
                    }
                };

                if let Err(e) = session(ws_stream, contype, state, tx, rx).await {
                    error!("Closing session to {:?}", stream.peer_addr());
                    error!("{e}")
                }
            });
            handles.push(handle)
        }

        Ok(())
    }
}

type WSStream<'n> = IntoStream<WebSocketStream<&'n mut TcpStream>>;

async fn init(stream: &mut TcpStream) -> Result<(WSStream, ConnectionType)> {
    let addr = stream
        .peer_addr()
        .context("connected streams should have a peer address")?;
    info!("Peer address: {}", addr);

    let mut ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .context("Error during the websocket handshake occurred")?
        .into_stream();

    // wait for init
    let msg = ws_stream.try_next().await;
    let message = msg
        .map(|m| m.ok_or(anyhow!("no message given")))
        .context("error occurred while reading from stream")??;
    let command: Message = match message {
        tungstenite::Message::Text(text) => {
            serde_json::from_str(&text).context("failed to parse message")?
        }
        tungstenite::Message::Close(_) => return Err(anyhow!("closing early")),
        _ => return Err(anyhow!("invalid message data type")),
    };
    match command {
        Message::Init { connection_type } => return Ok((ws_stream, connection_type)),
        _ => return Err(anyhow!("no init given")),
    }
}

async fn session<'n>(
    mut stream: WSStream<'n>,
    connection_type: ConnectionType,
    state: Arc<Mutex<State>>,
    tx: Sender<Message>,
    mut rx: Receiver<Message>,
) -> Result<()> {
    if let ConnectionType::Controller = connection_type {
        if let Some(config) = &(state.lock().await).latest_config {
            tx.send(Message::Config(config.clone()))?;
        }
    }

    loop {
        if let Some(msg) = stream.try_next().now_or_never() {
            if let Some(message) = msg.context("error occurred while reading from stream")? {
                let command: Result<Message, serde_json::Error> = match message {
                    tungstenite::Message::Text(text) => serde_json::from_str(&text),
                    tungstenite::Message::Close(_) => return Ok(()),
                    _ => return Err(anyhow!("invalid message data type")),
                };

                // update latest config if new config set
                match command {
                    Ok(command) => {
                        match command {
                            Message::Config(ref c) => {
                                let mut s = state.lock().await;
                                s.latest_config = Some(c.clone());
                            }
                            _ => {}
                        }
                        tx.send(command)?;
                    }
                    Err(e) => {
                        error!("{e}");
                        let message = Message::Error {
                            message: format!("failed to parse message: {e}"),
                        };
                        let value =
                            serde_json::to_string(&message).context("failed to send message")?;
                        stream.send(tungstenite::Message::Text(value)).await?;
                    }
                }
            }
        };

        if let Ok(cmd) = rx.try_recv() {
            match cmd {
                Message::Config(_) => {
                    let value = serde_json::to_string(&cmd).context("failed to send cmd")?;
                    stream.send(tungstenite::Message::Text(value)).await?;
                }
                Message::Create { .. } => {
                    if let ConnectionType::Canvas = connection_type {
                        let value = serde_json::to_string(&cmd).context("failed to send cmd")?;
                        stream.send(tungstenite::Message::Text(value)).await?;
                    }
                }
                _ => {}
            }
        }

        sleep(Duration::from_millis(16)).await;
    }
}
