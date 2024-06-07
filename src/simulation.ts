import { Color } from './color'
import { COLORING_PERCENT, CREATURE_SIZE, TIMESTEP_MS } from './constants'
import { Creature } from './creature'
import { Map } from './map'
import { debug } from './log'
import { vec2 } from './vec'

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
        debug('clicked at ', x, y)

        const r = () => Math.floor(Math.random() * 255)
        this.addCreature(
          new Creature({
            position: vec2(x, y),
            size: 2,
            color: new Color(r(), r(), r()),
          }),
        )
      },
      false,
    )
  }

  private drawLoop() {
    const buffer = this.ctx.createImageData(
      this.canvas.width,
      this.canvas.height,
    )
    setInterval(() => {
      this.update()
      this.draw(buffer)
      // this.grid();
    }, TIMESTEP_MS)
  }

  private update() {
    for (const c of this.creatures) {
      // move to new pos
      c.step()
      let [x, y] = c.position
      // bound x,y
      if (x! < 0) x = this.canvas.width - x!
      if (x! > this.canvas.width - 1) x! %= this.canvas.width
      if (y! < 0) y = this.canvas.height - y!
      if (y! > this.canvas.height - 1) y! %= this.canvas.height

      // update tile
      const [i, j] = this.map.index(x!, y!)
      const tc = this.map.get(i!, j!)
      const col = tc.clone().gradient(c.color, COLORING_PERCENT)
      this.map.set(i!, j!, col)
    }
  }

  private draw(buffer: ImageData) {
    for (let j = 0; j < this.map.height; j++) {
      for (let i = 0; i < this.map.width; i++) {
        const c = this.map.data[j]![i]!
        this.ctx.fillStyle = c.rgb()
        this.ctx.fillRect(
          i * this.map.tWidth,
          j * this.map.tHeight,
          this.map.tWidth,
          this.map.tHeight,
        )
      }
    }
    // draw creatures
    for (const c of this.creatures) {
      const [x, y] = c.position
      this.ctx.fillStyle = c.color.rgb()
      this.ctx.fillRect(x!, y!, CREATURE_SIZE, CREATURE_SIZE)
    }
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
