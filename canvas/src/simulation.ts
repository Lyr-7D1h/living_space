import { Color } from './color'
import { COLORING_PERCENT, CREATURE_SIZE, DEBUG } from './constants'
import { Creature } from './creature'
import { debug } from './log'
import { vec2 } from './vec'
import { ImageBuffer } from './data'

function perf(cb: () => void) {
  const start = Date.now()
  cb()
  const d = Date.now() - start
  document.getElementById('debug')!.innerHTML =
    `${d}ms<br />${Math.round(1000 / d)}fps`
}

/** responsible for building and rendering the entire simulated world */
export class Simulation {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  creatures: Creature[]

  constructor() {
    this.canvas = document.getElementById('root')! as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight

    debug(`Created ${this.ctx.canvas.width}x${this.ctx.canvas.height} canvas`)

    this.creatures = []
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  start() {
    this.setup()
    // this.grid();

    this.draw()
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

  private draw() {
    // for (let i = 0; i < 1000; i++) {
    //   this.creatures.push(Creature.random())
    // }

    const map = new ImageBuffer(
      this.ctx.createImageData(this.canvas.width, this.canvas.height),
    )
    // initialize canvas with white pixels, looks slightly better on borders
    map.fill(0, 0, map.width, map.height, new Color(255, 255, 255))

    requestAnimationFrame(() => {
      if (DEBUG) {
        perf(() => {
          this.drawLoop(map)
        })
      } else {
        this.drawLoop(map)
      }
    })
  }

  private drawLoop(map: ImageBuffer) {
    // this.ctx.putImageData(map.data, 0, 0)
    for (const c of this.creatures) {
      // update character
      c.step()
      const { x, y } = c.position
      // bound x,y
      if (x < 0) c.position.set(0, this.canvas.width + x)
      if (x > this.canvas.width - 1) c.position.set(0, x % this.canvas.width)
      if (y < 0) c.position.set(1, this.canvas.height + y)
      if (y > this.canvas.height - 1) {
        c.position.set(1, y % this.canvas.height)
      }
    }
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i]!
      const p = c.position
      map.gradientCircle(p, 10, c.color, COLORING_PERCENT)
      // map.gradientRectangle(
      //   p.x - 5,
      //   p.y - 5,
      //   CREATURE_SIZE + 10,
      //   CREATURE_SIZE + 10,
      //   c.color,
      //   COLORING_PERCENT,
      // )
    }
    const cmap = map.clone()

    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i]!
      const p = c.position
      cmap.fill(p.x, p.y, CREATURE_SIZE, CREATURE_SIZE, c.color)
    }
    this.ctx.putImageData(cmap.data, 0, 0)

    requestAnimationFrame(() => {
      if (DEBUG) {
        perf(() => {
          this.drawLoop(map)
        })
      } else {
        this.drawLoop(map)
      }
    })
  }

  addCreature(creature: Creature) {
    debug(`Adding creature ${JSON.stringify(creature)}`)
    this.creatures.push(creature)
  }
}
