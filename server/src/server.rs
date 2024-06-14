use std::time::Duration;

use futures_util::{stream::IntoStream, FutureExt, SinkExt, TryStreamExt};
use log::{debug, error, info};

use anyhow::{anyhow, Context, Result};

use serde::{Deserialize, Serialize};
use tokio::{
    net::{TcpListener, TcpStream, ToSocketAddrs},
    sync::broadcast::{self, Receiver, Sender},
    time::sleep,
};
use tokio_tungstenite::{tungstenite::Message, WebSocketStream};

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Command {
    Init {
        connection_type: ConnectionType,
    },
    Config {
        width: u32,
        height: u32,
    },
    Create {
        position: Vec<u32>,
        size: u32,
        color: Vec<u32>,
        characteristics: Characteristics,
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
pub struct Characteristics {
    curiosity: u32,
    dominance: u32,
    friendliness: u32,
}

pub struct SimulationServer {
    listener: TcpListener,
}

impl SimulationServer {
    pub async fn bind<A: ToSocketAddrs>(addr: A) -> Result<SimulationServer> {
        let listener = TcpListener::bind(addr).await?;

        return Ok(SimulationServer { listener });
    }

    pub async fn listen(self) -> Result<()> {
        info!("Listening on: {:?}", self.listener.local_addr()?);
        let (tx, rx) = broadcast::channel::<Command>(100);

        let mut handles = vec![];
        while let Ok((mut stream, _)) = self.listener.accept().await {
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

                if let Err(e) = session(ws_stream, contype, tx, rx).await {
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
    let command: Command = match message {
        Message::Text(text) => serde_json::from_str(&text).context("failed to parse command")?,
        Message::Close(_) => return Err(anyhow!("closing early")),
        _ => return Err(anyhow!("invalid message data type")),
    };
    match command {
        Command::Init { connection_type } => return Ok((ws_stream, connection_type)),
        _ => return Err(anyhow!("no init given")),
    }
}

async fn session<'n>(
    mut stream: WSStream<'n>,
    connection_type: ConnectionType,
    mut tx: Sender<Command>,
    mut rx: Receiver<Command>,
) -> Result<()> {
    loop {
        if let Some(msg) = stream.try_next().now_or_never() {
            if let Some(message) = msg.context("error occurred while reading from stream")? {
                let command: Command = match message {
                    Message::Text(text) => {
                        serde_json::from_str(&text).context("failed to parse command")?
                    }
                    Message::Close(_) => return Ok(()),
                    _ => return Err(anyhow!("invalid message data type")),
                };
                tx.send(command)?;
            }
        };

        if let Ok(cmd) = rx.try_recv() {
            match cmd {
                Command::Config { .. } => {
                    if let ConnectionType::Controller = connection_type {
                        let value = serde_json::to_string(&cmd).context("failed to send cmd")?;
                        stream.send(Message::Text(value)).await?;
                    }
                }
                Command::Create { .. } => {
                    if let ConnectionType::Canvas = connection_type {
                        let value = serde_json::to_string(&cmd).context("failed to send cmd")?;
                        stream.send(Message::Text(value)).await?;
                    }
                }
                _ => {}
            }
        }

        sleep(Duration::from_millis(16)).await;
    }
}
