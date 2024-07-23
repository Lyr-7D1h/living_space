import QrCreator from 'qr-creator'
import { Color } from './color'
import { connect } from './connection'
import { CONSTANTS } from './constants'
import { Creature } from './creature'
import { Simulation } from './simulation'
import { error } from './util'
import { vec } from './vec'

const { SYNC_SERVER_URL } = CONSTANTS

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

  const connection = await connect(url).catch((e) => {
    error(e)
  })

  if (typeof connection === 'undefined') {
    setTimeout(() => {
      sync().catch(error)
    }, 500)
    return
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
      const cmd = d
      switch (cmd.type) {
        case 'id': {
          if (CONSTANTS.QR) {
            const href = `${CONSTANTS.CONTROLLER_URL}?id=${cmd.id}`
            document.getElementById('qr-link')!.setAttribute('href', href)
            QrCreator.render(
              {
                text: href,
                radius: 0.3, // 0.0 to 0.5
                ecLevel: 'H', // L, M, Q, H
                fill: '#000', // foreground color
                background: '#ffffff66', // color or null for transparent
                size: 128, // in pixels
              },
              document.getElementById('qr')!,
            )
          }
          break
        }
        case 'create': {
          const creature = new Creature(simulation.creatures.length, {
            position: vec(...cmd.position),
            color: new Color(cmd.color),
            personality: cmd.personality,
            ancestors: new Set(),
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
