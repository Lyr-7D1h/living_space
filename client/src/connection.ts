import { type CreatureArgs } from './creature'

/** Connect to socket in a blocking manner erroring in case of timeout or error */
export async function connect(addr: string): Promise<Connection> {
  return await new Promise((resolve, reject) => {
    const connection = new Connection(addr)

    let returned = false
    connection.on('error', () => {
      returned = true
      reject(new Error(`connection to ${addr} failed`))
    })

    connection.on('open', () => {
      returned = true
      resolve(connection)
    })

    setTimeout(() => {
      if (!returned) {
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
  | (CreatureArgs & { type: 'create' })

export class Connection {
  private readonly socket: WebSocket

  /**
   *
   * @param addr (ex. `ws:://localhost:2020`)
   */
  constructor(addr: string) {
    this.socket = new WebSocket(addr)
  }

  on(type: 'message', cb: (data: unknown) => void): void
  on(type: 'open' | 'error', cb: (data: Event) => void): void
  on(type: 'message' | 'open' | 'error', cb: (event: Event) => void): void {
    switch (type) {
      case 'message':
        this.socket.addEventListener('message', (e) => {
          cb(JSON.parse(e.data))
        })
        break
      case 'open':
      case 'error':
        this.socket.addEventListener(type, (e) => {
          cb(e)
        })
    }
  }

  send(cmd: Message) {
    this.socket.send(JSON.stringify(cmd))
  }

  init() {
    this.socket.send(JSON.stringify({}))
  }

  connected() {
    return this.socket.readyState === 1
  }
}
