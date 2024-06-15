import { type Connection, connect } from './connection'
import { error, info } from './util'

let URL = 'ws://localhost:7543'
const host = new URLSearchParams(window.location.search).get('host')
if (host !== null) {
  URL = `ws://${host}:7543`
}

export function setupCreator(
  connection: Connection,
  canvasWidth: number,
  canvasHeight: number,
) {
  // setup position canvas to get starting position
  const posCanvas = document.getElementById('position')! as HTMLCanvasElement
  posCanvas.width = 500
  posCanvas.height = 500 * (canvasHeight / canvasWidth)
  const ctx = posCanvas.getContext('2d')!
  let position: [number, number] = [posCanvas.width / 2, posCanvas.height / 2]
  ctx.fillStyle = '#29A4DA'
  ctx.beginPath()
  ctx.arc(position[0], position[1], 5, 0, 2 * Math.PI)
  ctx.fill()
  posCanvas.onclick = (e) => {
    ctx.clearRect(0, 0, posCanvas.width, posCanvas.height)
    position = [e.offsetX, e.offsetY]
    ctx.beginPath()
    ctx.arc(position[0], position[1], 5, 0, 2 * Math.PI)
    ctx.fill()
  }

  const color = document.getElementById('color')! as HTMLInputElement
  color.onchange = function (_) {
    if ('value' in this && typeof this.value !== 'undefined') {
      ctx.fillStyle = this.value as string
      ctx.clearRect(0, 0, posCanvas.width, posCanvas.height)
      ctx.beginPath()
      ctx.arc(position[0], position[1], 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  document.getElementById('submit')!.removeAttribute('disabled')

  const form = document.getElementById(
    'creature_creator_form',
  )! as HTMLFormElement
  form.onsubmit = (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const scale = (x: number) => Math.floor(x * (canvasWidth / 500))

    const color = (data.get('color')! as string)
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => '#' + r + r + g + g + b + b,
      )
      .substring(1)
      .match(/.{2}/g)!
      .map((x) => parseInt(x, 16))

    connection.send({
      type: 'create',
      position: [scale(position[0]), scale(position[1])],
      size: 4,
      color,
      characteristics: {
        curiosity: parseInt(data.get('curiosity')! as string),
        dominance: parseInt(data.get('dominance')! as string),
        friendliness: parseInt(data.get('friendliness')! as string),
      },
    })
  }

  console.log('creator setup')
}

async function main() {
  const infoBlock = info(`Connecting to ${URL}`, true)
  const connection = await connect(URL).catch((e) => {
    error(e)
    return undefined
  })
  infoBlock.remove()
  if (typeof connection === 'undefined') {
    throw Error('failed to connect')
  }
  connection.send({
    type: 'init',
    connection_type: 'controller',
  })

  connection.on('message', (d) => {
    switch (d.type) {
      case 'config':
        setupCreator(connection, d.width, d.height)
        break
    }
  })
}

main().catch(error)
