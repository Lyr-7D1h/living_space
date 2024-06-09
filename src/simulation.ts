import { Color } from './color'
import { COLORING_PERCENT, CREATURE_SIZE } from './constants'
import { Creature } from './creature'
import { Map } from './map'
import { debug } from './log'
import { vec2 } from './vec'
import { ImageBuffer } from './data'

function perf(cb: () => void) {
  const start = Date.now()
  cb()
  document.getElementById('debug')!.innerHTML = `${Date.now() - start}ms`
}

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

        this.addCreature(Creature.random({ position: vec2(x, y) }))
      },
      false,
    )
  }

  private drawLoop() {
    for (let i = 0; i < 1000; i++) {
      this.creatures.push(Creature.random())
    }

    const prevData = new ImageBuffer(
      this.ctx.createImageData(this.canvas.width, this.canvas.height),
    )

    // setInterval(() => {
    //   perf(() => {
    //     this.draw(prevData)
    //   })
    // }, TIMESTEP_MS)
    requestAnimationFrame(() => {
      perf(() => {
        this.draw(prevData)
      })
    })
  }

  private draw(map: ImageBuffer) {
    for (const c of this.creatures) {
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
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i]!
      const p = c.position
      map.gradient(
        p.x - 5,
        p.y - 5,
        CREATURE_SIZE + 10,
        CREATURE_SIZE + 10,
        c.color,
        COLORING_PERCENT,
      )
    }
    const cmap = map.clone()

    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i]!
      const p = c.position
      cmap.fill(p.x, p.y, CREATURE_SIZE, CREATURE_SIZE, c.color)
    }
    this.ctx.putImageData(cmap.data, 0, 0)

    requestAnimationFrame(() => {
      perf(() => {
        this.draw(map)
      })
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
