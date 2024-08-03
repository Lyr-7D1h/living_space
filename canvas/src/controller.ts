import iro from '@jaames/iro'
import { type Connection, connect } from './connection'
import { error } from './util'
import { CONSTANTS } from './constants'
import { Creature } from './creature'
import { vec } from './vec'
import { Color } from './color'

const colorPicker = iro.ColorPicker('#color', {
  width: 300,
  height: 300,
  color: '#29A4DA',
})

function setupInfo() {
  const modal = document.getElementById('modal')!

  const info = document.getElementById('info-button')!
  info.onclick = () => {
    modal.style.display = 'block'
    info.style.display = 'none'
  }

  const close = document.getElementById('modal-close-button')!
  close.onclick = () => {
    modal.style.display = 'none'
    info.style.display = 'block'
  }
}

export function setupCreator(
  connection: Connection,
  canvasWidth: number,
  canvasHeight: number,
) {
  setupInfo()

  // setup position canvas to get starting position
  const posCanvas = document.getElementById('position')! as HTMLCanvasElement
  posCanvas.width =
    document.getElementById('position-content')!.clientWidth * 0.9
  posCanvas.height = (posCanvas.width * canvasHeight) / canvasWidth
  const ctx = posCanvas.getContext('2d')!
  let position: [number, number] = [
    Math.round(posCanvas.width / 2),
    Math.round(posCanvas.height / 2),
  ]
  ctx.fillStyle = colorPicker.color.hexString
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

  // const color = document.getElementById('color')! as HTMLInputElement
  colorPicker.on('color:change', function (color: any) {
    ctx.fillStyle = color.hexString
    ctx.clearRect(0, 0, posCanvas.width, posCanvas.height)
    ctx.beginPath()
    ctx.arc(position[0], position[1], 5, 0, 2 * Math.PI)
    ctx.fill()
  })

  const createButton = document.getElementById('create-button')!
  createButton.removeAttribute('disabled')

  const form = document.getElementById(
    'creature_creator_form',
  )! as HTMLFormElement
  const creatureArgs = () => {
    const data = new FormData(form)

    const scale = (i: number) => Math.floor(i * (canvasWidth / posCanvas.width))

    const color = colorPicker.color.hexString
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => '#' + r + r + g + g + b + b,
      )
      .substring(1)
      .match(/.{2}/g)!
      .map((x: string) => parseInt(x, 16)) as [number, number, number]
    return {
      position: [scale(position[0]), scale(position[1])] as [number, number],
      color,
      personality: {
        openness: parseInt(data.get('openness')! as string),
        conscientiousness: parseInt(data.get('conscientiousness')! as string),
        extraversion: parseInt(data.get('extraversion')! as string),
        agreeableness: parseInt(data.get('agreeableness')! as string),
        neuroticism: parseInt(data.get('neuroticism')! as string),
      },
    }
  }
  form.onsubmit = (e) => {
    e.preventDefault()

    connection.send({
      type: 'create',
      ...creatureArgs(),
    })
    createButton.setAttribute('disabled', '')
    setTimeout(() => {
      createButton.removeAttribute('disabled')
    }, 2000)
  }

  const detailsButton = document.getElementById('details-button')!
  detailsButton.removeAttribute('disabled')
  const details = document.getElementById('details')!
  detailsButton.onclick = () => {
    console.log(details.style.display)
    if (details.style.display === 'none') {
      details.style.display = 'block'
      return
    }
    details.style.display = 'none'
  }
  const updateDetails = () => {
    const args = creatureArgs()
    const creature = new Creature(0, {
      position: vec<2>(...args.position),
      color: new Color(args.color),
      personality: args.personality,
      ancestors: new Set(),
    })
    details.innerHTML = JSON.stringify(
      {
        coloringSpread: creature.coloringSpread,
        coloringPercentage: creature.coloringPercentage,
        speed: creature.speed,
        attraction: creature.attraction,
        viewport: creature.viewport,
        preference: creature.preference.p, // TODO: send preference to server
      },
      null,
      '\t',
    )
  }
  updateDetails()
  form.onchange = updateDetails
  console.log('creator setup')
}

async function sync() {
  const connection = await connect(CONSTANTS.SYNC_SERVER_URL).catch((e) => {
    error(e)
  })
  if (typeof connection === 'undefined') {
    setTimeout(async () => await sync().catch(error), 1000)
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  connection.on('close', async () => {
    setTimeout(async () => await sync().catch(error), 1000)
  })
  const id = new URLSearchParams(window.location.search).get('id')
  if (id === null) {
    error('no id provided')
    return
  }
  connection.send({
    type: 'init',
    connection_type: 'controller',
    id,
  })

  connection.on('message', (d) => {
    switch (d.type) {
      case 'error':
        error(d.message)
        break
      case 'config':
        setupCreator(connection, d.width, d.height)
        break
    }
  })
}

sync().catch(error)
