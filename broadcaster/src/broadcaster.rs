use std::{collections::HashMap, sync::Arc, time::Duration};

use log::{error, info};
use uuid::Uuid;

use anyhow::{anyhow, Context, Result};

use crate::message_stream::{Config, ConnectionType, Message};

use super::message_stream::MessageStream;

use tokio::{
    net::{TcpListener, TcpStream, ToSocketAddrs},
    sync::{
        mpsc::{self, Receiver, Sender},
        Mutex,
    },
    time::sleep,
};

#[derive(Debug, Clone)]
pub struct Canvas {
    tx: Sender<Message>,
    config: Config,
}

type State = Arc<Mutex<HashMap<String, Canvas>>>;

pub struct Broadcaster {
    listener: TcpListener,
    state: State,
}

impl Broadcaster {
    pub async fn bind<A: ToSocketAddrs>(addr: A) -> Result<Broadcaster> {
        let listener = TcpListener::bind(addr).await?;

        return Ok(Broadcaster {
            listener,
            state: Arc::new(Mutex::new(HashMap::new())),
        });
    }

    pub async fn listen(self) -> Result<()> {
        info!("Listening on: {:?}", self.listener.local_addr()?);

        let mut handles = vec![];
        while let Ok((mut stream, _)) = self.listener.accept().await {
            let state = self.state.clone();
            let handle = tokio::spawn(async move {
                let (msg_stream, contype) = match init(&mut stream).await {
                    Ok(r) => r,
                    Err(e) => {
                        error!("Closing session to {:?}", stream.peer_addr());
                        error!("{e}");
                        return;
                    }
                };

                match contype {
                    ConnectionType::Canvas => {
                        if let Err(e) = canvas(msg_stream, state).await {
                            error!("Closing session to {:?}", stream.peer_addr());
                            error!("{e}")
                        }
                    }
                    ConnectionType::Controller { id } => {
                        if let Err(e) = controller(id, msg_stream, state).await {
                            error!("Closing session to {:?}", stream.peer_addr());
                            error!("{e}")
                        }
                    }
                }
            });
            handles.push(handle)
        }

        Ok(())
    }
}

async fn init(stream: &mut TcpStream) -> Result<(MessageStream, ConnectionType)> {
    let addr = stream
        .peer_addr()
        .context("connected streams should have a peer address")?;
    info!("Peer address: {}", addr);

    let mut stream = MessageStream::new(stream).await?;

    // wait for init
    let message = stream.read().await?;
    let connection_type = match message {
        Message::Init(connection_type) => connection_type,
        _ => return Err(anyhow!("no init given")),
    };

    return Ok((stream, connection_type));
}

async fn controller<'n>(id: String, mut stream: MessageStream<'n>, state: State) -> Result<()> {
    let canvas = {
        match state.lock().await.get(&id) {
            Some(c) => c.clone(),
            None => {
                stream
                    .send(Message::Error {
                        message: format!("canvas '{id}' not found"),
                    })
                    .await?;
                return Err(anyhow!("canvas '{id}' not found"));
            }
        }
    };

    stream.send(Message::Config(canvas.config.clone())).await?;

    loop {
        let message = stream.read().await.context("failed to read message")?;
        match message {
            Message::Create { .. } => {
                canvas
                    .tx
                    .send(message)
                    .await
                    .context("failed to send message")?;
            }
            _ => {}
        }
        sleep(Duration::from_millis(50)).await;
    }
}

async fn canvas<'n>(mut stream: MessageStream<'n>, state: State) -> Result<()> {
    let config = match stream.read().await? {
        Message::Config(c) => c,
        _ => {
            stream.send(Message::error("expected config")).await?;
            return Err(anyhow!("expected config"));
        }
    };

    let (tx, rx) = mpsc::channel::<Message>(10);
    let id = Uuid::new_v4().to_string();
    {
        let mut state = state.lock().await;
        state.insert(id.clone(), Canvas { tx, config });
    }
    stream.send(Message::Id { id: id.clone() }).await?;

    if let Err(e) = canvas_listener(&id.clone(), stream, rx, state.clone()).await {
        let mut state = state.lock().await;
        state.remove(&id);
        return Err(e);
    }

    Ok(())
}

async fn canvas_listener<'n>(
    id: &String,
    mut stream: MessageStream<'n>,
    mut rx: Receiver<Message>,
    state: State,
) -> Result<()> {
    loop {
        if let Some(msg) = stream.read_now().await.context("failed to read message")? {
            // update latest config if new config set
            match msg {
                Message::Config(ref c) => {
                    let mut s = state.lock().await;
                    s.get_mut(id)
                        .context(format!("unexpectedly removed {id}"))?
                        .config = c.clone();
                }
                _ => {}
            }
        };

        if let Ok(cmd) = rx.try_recv() {
            match cmd {
                Message::Create { .. } => {
                    stream.send(cmd).await.context("failed to send message")?;
                }
                _ => {}
            }
        }

        sleep(Duration::from_millis(16)).await;
    }
}
