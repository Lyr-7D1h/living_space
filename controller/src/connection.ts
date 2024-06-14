/** Connect to socket in a blocking manner erroring in case of timeout or error */
export async function connect(addr: string): Promise<Connection> {
  return await new Promise((resolve, reject) => {
    const connection = new Connection(addr)

    let returned = false
    connection.on('error', () => {
      returned = true
      return reject(new Error(`connection to ${addr} failed`))
    })

    connection.on('open', () => {
      returned = true
      return resolve(connection)
    })

    setTimeout(() => {
      if (!returned) {
        return reject(new Error('connection timed out'))
      }
    }, 8000)
  })
}

export type Message =
  | {
      type: 'init'
      connection_type: 'controller'
    }
  | {
      type: 'config'
      width: number
      height: number
    }
  | (CreatureArgs & { type: 'create' })
export interface Characteristics {
  curiosity: number
  dominance: number
  friendliness: number
}
export type CreatureArgs = {
  position: number[]
  size: number
  color: number[]
  characteristics: Characteristics
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
  on(type: 'open' | 'error', cb: (data: Event) => void): void
  on(type: 'message' | 'open' | 'error', cb: (event: any) => void): void {
    switch (type) {
      case 'message':
        this.socket.addEventListener('message', (e) => {
          cb(JSON.parse(e.data) as Message)
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

  connected() {
    return this.socket.readyState === 1
  }
}
