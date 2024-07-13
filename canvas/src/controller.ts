import iro from '@jaames/iro'
import { type Connection, connect } from './connection'
import { error } from './util'
import { CONSTANTS } from './constants'

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
    document.getElementById('position-content')!.clientWidth - 50
  posCanvas.height = 500 * (canvasHeight / canvasWidth)
  const ctx = posCanvas.getContext('2d')!
  let position: [number, number] = [posCanvas.width / 2, posCanvas.height / 2]
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

  const submit = document.getElementById('submit')!
  submit.removeAttribute('disabled')

  const form = document.getElementById(
    'creature_creator_form',
  )! as HTMLFormElement
  console.log(form)
  form.onsubmit = (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const scale = (x: number) => Math.floor(x * (canvasWidth / 500))

    const color = colorPicker.color.hexString
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => '#' + r + r + g + g + b + b,
      )
      .substring(1)
      .match(/.{2}/g)!
      .map((x: string) => parseInt(x, 16)) as [number, number, number]

    connection.send({
      type: 'create',
      position: [scale(position[0]), scale(position[1])],
      size: 2,
      color,
      personality: {
        openness: parseInt(data.get('openness')! as string),
        conscientiousness: parseInt(data.get('conscientiousness')! as string),
        extraversion: parseInt(data.get('extraversion')! as string),
        agreeableness: parseInt(data.get('agreeableness')! as string),
        neuroticism: parseInt(data.get('neuroticism')! as string),
      },
    })
    submit.setAttribute('disabled', '')
    setTimeout(() => {
      submit.removeAttribute('disabled')
    }, 2000)
  }

  console.log('creator setup')
}

async function sync() {
  let connection = await connect(CONSTANTS.SYNC_SERVER_URL).catch((e) => {
    error(e)
  })
  while (typeof connection === 'undefined') {
    connection = await connect(CONSTANTS.SYNC_SERVER_URL).catch((e) => {
      error(e)
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  connection.on('close', async () => {
    await sync()
  })
  connection.send({
    type: 'init',
    connection_type: 'controller',
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
