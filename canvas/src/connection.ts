import { type Personality } from './creature'

/** Connect to socket in a blocking manner erroring in case of timeout or error */
export async function connect(addr: string): Promise<Connection> {
  return await new Promise((resolve, reject) => {
    const connection = new Connection(addr)

    let returned = false
    connection.on('error', () => {
      returned = true
      connection.close()
      reject(new Error(`connection to ${addr} failed`))
    })

    connection.on('open', () => {
      returned = true
      resolve(connection)
    })

    setTimeout(() => {
      if (!returned) {
        connection.close()
        reject(new Error('connection timed out'))
      }
    }, 8000)
  })
}

export type Message =
  | {
      type: 'init'
      connection_type: 'canvas' | 'controller'
    }
  | {
      type: 'config'
      width: number
      height: number
    }
  | {
      type: 'create'
      position: [number, number]
      size: number
      color: [number, number, number]
      personality: Personality
    }

export class Connection {
  private readonly socket: WebSocket

  /**
   *
   * @param addr (ex. `ws:://localhost:2020`)
   */
  constructor(addr: string) {
    this.socket = new WebSocket(addr)
  }

  on(type: 'message', cb: (data: Message) => void): void
  on(type: 'open' | 'error' | 'close', cb: (data: Event) => void): void
  on(
    type: 'message' | 'open' | 'error' | 'close',
    cb: (event: any) => void,
  ): void {
    switch (type) {
      case 'message':
        this.socket.addEventListener('message', (e) => {
          cb(JSON.parse(e.data as string))
        })
        break
      case 'open':
      case 'error':
      case 'close':
        this.socket.addEventListener(type, (e) => {
          cb(e)
        })
    }
  }

  send(cmd: Message) {
    this.socket.send(JSON.stringify(cmd))
  }

  close() {
    this.socket.close()
  }

  connected() {
    return this.socket.readyState === 1
  }
}
