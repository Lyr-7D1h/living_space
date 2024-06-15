import { Color } from './color'
import { type Command, connect } from './connection'
import { SYNC_SERVER_URL } from './constants'
import { Creature } from './creature'
import { Simulation } from './simulation'
import { error } from './util'
import { vec2 } from './vec'

const simulation = new Simulation()
simulation.start()

// allow acccess through console useful for debugging
window.simulation = simulation

async function sync() {
  let url = SYNC_SERVER_URL
  const host = new URLSearchParams(window.location.search).get('host')
  if (host !== null) {
    url = `ws://${host}:7543`
  }

  let connection = await connect(url).catch((e) => {
    error(e)
  })

  while (typeof connection === 'undefined') {
    connection = await connect(url).catch((e) => {
      error(e)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  connection.on('close', async () => {
    await sync()
  })

  if (typeof connection !== 'undefined') {
    connection.send({
      type: 'init',
      connection_type: 'canvas',
    })
    connection.send({
      type: 'config',
      width: simulation.width,
      height: simulation.height,
    })
    connection.on('message', (d) => {
      const cmd = d as Command
      switch (cmd.type) {
        case 'create': {
          const creature = new Creature({
            position: vec2(...cmd.position),
            size: cmd.size,
            color: new Color(cmd.color),
            characteristics: cmd.characteristics,
          })
          simulation.addCreature(creature)
          break
        }
      }
    })
  }
}
sync().catch(error)

declare global {
  interface Window {
    simulation: Simulation
  }
}
