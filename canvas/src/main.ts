import { type Message, connect } from './connection'
import { setupCreator } from './creator'
import { Creature } from './creature'
import { Simulation } from './simulation'
import { error, info } from './util'

const URL = 'ws://localhost:8523'

await (async () => {
  const simulation = new Simulation()
  simulation.start()

  setupCreator()

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
    connection.on('message', (d) => {
      const msg = d as Message
      switch (msg.type) {
        case 'create': {
          const creature = new Creature(msg)
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
