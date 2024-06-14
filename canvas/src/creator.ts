import { Color } from './color'
import { Creature } from './creature'
import { CDF } from './random'
import { vec2 } from './vec'

export function setupCreator() {
  // setup position canvas to get starting position
  const posCanvas = document.getElementById('position')! as HTMLCanvasElement
  posCanvas.width = 300
  posCanvas.height = 300 * (window.innerHeight / window.innerWidth)
  const ctx = posCanvas.getContext('2d')!
  let position = vec2(posCanvas.width / 2, posCanvas.height / 2)
  ctx.fillStyle = '#29A4DA'
  ctx.beginPath()
  ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI)
  ctx.fill()
  posCanvas.onclick = (e) => {
    ctx.clearRect(0, 0, posCanvas.width, posCanvas.height)
    position = vec2(e.offsetX, e.offsetY)
    ctx.beginPath()
    ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI)
    ctx.fill()
  }

  const color = document.getElementById('color')! as HTMLInputElement
  color.onchange = function (e) {
    if ('value' in this && typeof this.value !== 'undefined') {
      ctx.fillStyle = this.value as string
      ctx.clearRect(0, 0, posCanvas.width, posCanvas.height)
      ctx.beginPath()
      ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  const form = document.getElementById(
    'creature_creator_form',
  )! as HTMLFormElement
  form.onsubmit = (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const preference = new CDF(
      ...Array.from({ length: 9 }, (_) => Math.floor(Math.random() * 50)),
    )
    window.simulation.addCreature(
      new Creature({
        position: position
          .clone()
          .mul(window.innerWidth / 300)
          .floor(),
        size: 4,
        color: Color.fromHex(data.get('color')! as string),
        coloringPercentage: 0.1,
        preference,
        speed: 2,
      }),
    )
  }
}
