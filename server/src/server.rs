use std::time::Duration;

use futures_util::{FutureExt, TryStreamExt};
use log::{debug, error, info};

use anyhow::{anyhow, Context, Result};

use serde::Deserialize;
use tokio::{
    net::{TcpListener, TcpStream, ToSocketAddrs},
    time::sleep,
};
use tokio_tungstenite::tungstenite::Message;

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Command {
    Init {
        connection_type: ConnectionType,
    },
    Create {
        position: Vec<u32>,
        size: u32,
        color: Vec<u32>,
        characteristics: Characteristics,
    },
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionType {
    Canvas,
    Controller,
}
#[derive(Debug, Deserialize)]
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

        let mut handles = vec![];
        while let Ok((mut stream, _)) = self.listener.accept().await {
            let handle = tokio::spawn(async move {
                if let Err(e) = session(&mut stream).await {
                    error!("Closing session to {:?}", stream.peer_addr());
                    error!("{e}")
                }
            });
            println!("a");
            handles.push(handle)
        }

        Ok(())
    }
}

async fn session(stream: &mut TcpStream) -> Result<()> {
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
        Message::Close(_) => return Ok(()),
        _ => return Err(anyhow!("invalid message data type")),
    };
    match command {
        Command::Init { connection_type } => match connection_type {
            ConnectionType::Canvas => info!("New canvas"),
            _ => {}
        },
        _ => return Err(anyhow!("no init given")),
    }

    loop {
        if let Some(msg) = ws_stream.try_next().now_or_never() {
            if let Some(message) = msg.context("error occurred while reading from stream")? {
                let command: Command = match message {
                    Message::Text(text) => {
                        serde_json::from_str(&text).context("failed to parse command")?
                    }
                    Message::Close(_) => return Ok(()),
                    _ => return Err(anyhow!("invalid message data type")),
                };
                match command {
                    Command::Create {
                        position,
                        size,
                        color,
                        characteristics,
                    } => todo!(),
                    _ => debug!("ignoring {command:?}"),
                }
            }
        };
        sleep(Duration::from_millis(16)).await;
    }
}
