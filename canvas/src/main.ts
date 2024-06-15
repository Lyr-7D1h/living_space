import { Color } from './color'
import { type Command, connect } from './connection'
import { Creature } from './creature'
import { Simulation } from './simulation'
import { error, info } from './util'
import { vec2 } from './vec'

let URL = 'ws://localhost:7543'
const host = new URLSearchParams(window.location.search).get('host')
if (host !== null) {
  URL = `ws://${host}:7543`
}

await (async () => {
  const simulation = new Simulation()
  simulation.start()

  // allow acccess through console useful for debugging
  window.simulation = simulation

  const infoBlock = info(`Connecting to ${URL}`, true)
  const connection = await connect(URL).catch((e) => {
    error(e)
    // error(`failed to connect to ${URL} runnning in local mode`)
  })
  infoBlock.remove()
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
})()

declare global {
  interface Window {
    simulation: Simulation
  }
}
