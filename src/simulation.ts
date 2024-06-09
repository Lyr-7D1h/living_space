import { Color } from './color'
import { COLORING_PERCENT, CREATURE_SIZE, TIMESTEP_MS } from './constants'
import { Creature, neighbors } from './creature'
import { Map } from './map'
import { debug } from './log'
import { type Vector, vec2 } from './vec'
import { ImageBuffer } from './data'

/** responsible for building and rendering the entire simulated world */
export class Simulation {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  map: Map
  creatures: Creature[]

  constructor() {
    this.canvas = document.getElementById('root')! as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight
    debug(`Created ${this.ctx.canvas.width}x${this.ctx.canvas.height} canvas`)

    this.map = new Map(this.canvas.width, this.canvas.height)
    this.creatures = []
  }

  start() {
    this.setup()
    // this.grid();
    this.drawLoop()
  }

  private setup() {
    this.canvas.addEventListener(
      'click',
      (event) => {
        const x = event.pageX
        const y = event.pageY
        const r = () => Math.floor(Math.random() * 255)
        const color = new Color(r(), r(), r())
        debug(`new creature at ${x} ${y} with ${color.rgb()}`)

        this.addCreature(
          new Creature({
            position: vec2(x, y),
            size: 2,
            color,
          }),
        )
      },
      false,
    )
  }

  private drawLoop() {
    for (let i = 0; i < 3000; i++) {
      const x = () => Math.floor(Math.random() * this.canvas.width)
      const y = () => Math.floor(Math.random() * this.canvas.height)
      const r = () => Math.floor(Math.random() * 255)
      this.creatures.push(
        new Creature({
          position: vec2(x(), y()),
          color: new Color(r(), r(), r()),
          size: 2,
        }),
      )
    }

    const prevData = new ImageBuffer(
      this.ctx.createImageData(this.canvas.width, this.canvas.height),
    )
    // setInterval(() => {}, TIMESTEP_MS)

    requestAnimationFrame(() => {
      this.draw(prevData)
    })
  }

  private update() {
    for (const c of this.creatures) {
      // move to new pos
      c.step()
      const { x, y } = c.position

      // bound x,y
      if (x < 0) c.position.set(0, this.canvas.width - x)
      if (x > this.canvas.width - 1) c.position.set(0, x % this.canvas.width)
      if (y < 0) c.position.set(1, this.canvas.height - y)
      if (y > this.canvas.height - 1) c.position.set(1, y % this.canvas.height)

      // update tile
      const i = this.map.index(c.position)
      const tc = this.map.get(i)
      const col = tc.clone().gradient(c.color, COLORING_PERCENT)
      this.map.set(i, col)
    }
  }

  private draw(prevData: ImageBuffer) {
    const start = Date.now()
    // create new buffer
    const data = new ImageBuffer(
      this.ctx.createImageData(this.canvas.width, this.canvas.height),
    )

    // this.update()
    // this.draw(buffer)
    const history: Array<[Vector<2>, Uint8ClampedArray[]]> = []
    for (const c of this.creatures) {
      // update history
      const pp = c.position
      const prevColor = prevData.get(pp.x, pp.y, CREATURE_SIZE, CREATURE_SIZE)
      history.push([pp.clone(), prevColor.slice(0)])

      // update character
      c.step()
      const { x, y } = c.position
      // bound x,y
      if (x < 0) c.position.set(0, this.canvas.width - x)
      if (x > this.canvas.width - 1) c.position.set(0, x % this.canvas.width)
      if (y < 0) c.position.set(1, this.canvas.height - y)
      if (y > this.canvas.height - 1) {
        c.position.set(1, y % this.canvas.height)
      }
    }

    // set prev to current state
    prevData = data.clone()
    // update current
    for (let i = 0; i < this.creatures.length; i++) {
      let [pp, prevColor] = history[i]!
      pp = pp!
      prevColor = prevColor!
      const c = this.creatures[i]!
      const p = c.position
      data.set(pp.x, pp.y, CREATURE_SIZE, CREATURE_SIZE, prevColor)
      data.fill(p.x, p.y, CREATURE_SIZE, CREATURE_SIZE, c.color)
    }

    this.ctx.putImageData(data.data, 0, 0)

    document.getElementById('debug')!.innerHTML = `${Date.now() - start}ms`
    requestAnimationFrame(() => {
      this.draw(prevData)
    })
  }

  addCreature(creature: Creature) {
    this.creatures.push(creature)
  }

  /** debug grid */
  grid() {
    this.ctx.stroke()
    for (let x = 0; x < this.map.width; x++) {
      this.ctx.moveTo(x * this.map.tileWidth, 0)
      this.ctx.lineTo(
        x * this.map.tileWidth,
        this.map.height * this.map.tileHeight,
      )
    }
    for (let y = 0; y < this.map.height; y++) {
      this.ctx.moveTo(0, y * this.map.tileHeight)
      this.ctx.lineTo(
        this.map.width * this.map.tileWidth,
        y * this.map.tileHeight,
      )
    }
  }
}
