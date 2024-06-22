import { Color } from './color'
import { CONSTANT_TIME, DEBUG_INFO, DEBUG_VISUAL } from './constants'
import { Creature } from './creature'
import { debug } from './log'
import { vec2 } from './vec'
import { ImageBuffer } from './imageBuffer'
import { Debug } from './debug'
import { Map, SPACING } from './map'
import { mod } from './math'
import { PMF } from './random'

const debugEl = new Debug()

function perf(cb: () => void) {
  const start = Date.now()
  cb()
  const d = Date.now() - start
  if (DEBUG_INFO) {
    debugEl.set('fps', `${Math.round(1000 / d)}`)
    debugEl.set('delay', `${d}ms`)
  }
}

/** responsible for building and rendering the entire simulated world */
export class Simulation {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  painting: ImageBuffer
  creatures: Creature[]

  constructor() {
    this.canvas = document.getElementById('root')! as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight

    debug(`Created ${this.ctx.canvas.width}x${this.ctx.canvas.height} canvas`)

    this.creatures = []
    this.creatures.push(Creature.random({ position: vec2(600, 600) }))
    this.creatures.push(Creature.random({ position: vec2(500, 500) }))

    // for (let i = 0; i < 1; i++) {
    //   this.creatures.push(Creature.random())
    // }

    this.painting = new ImageBuffer(
      this.ctx.createImageData(this.canvas.width, this.canvas.height),
    )
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  start() {
    this.setup()

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
    const map = new Map(this.canvas.width, this.canvas.height)

    // initialize canvas with white pixels, looks slightly better on borders
    this.painting.rectangle(
      0,
      0,
      this.painting.width,
      this.painting.height,
      new Color(255, 255, 255),
    )

    // const i = map.getIndex([100, 50])
    // console.log(i, map.rowLength)

    if (CONSTANT_TIME > 0) {
      setInterval(() => {
        this.drawLoop(map)
      }, 500)

      return
    }
    requestAnimationFrame(() => {
      if (DEBUG_INFO) {
        perf(() => {
          this.drawLoop(map)
        })
      } else {
        this.drawLoop(map)
      }
    })
  }

  private drawLoop(map: Map) {
    if (DEBUG_INFO) {
      debugEl.set('pixels', this.creatures.length)
    }

    map.update(this.creatures)

    for (let ci = 0; ci < this.creatures.length; ci++) {
      const c = this.creatures[ci]!
      for (const cni of map.nearestNeighbors(
        this.creatures[ci]!.position.vec,
        200,
      )) {
        // skip itself
        if (cni === ci) continue

        const neighbor = this.creatures[cni]!
        const [cx, cy] = neighbor.position.vec
        const [x, y] = c.position.vec

        const theta = Math.atan2(cy - y, cx - x)
        // angle from 0 to 2pi
        const d = Math.PI / 6
        const i = mod(Math.round((theta - d) / d), 8)
        // build a binomial pmf for going towards a certain point
        const attraction: number[] = new Array(9).fill(0)
        // offset by 1 because creatures can also stay in position
        attraction[1 + mod(i - 2, 8)] = 1 / 16
        attraction[1 + mod(i + 2, 8)] = 1 / 16
        attraction[1 + mod(i - 1, 8)] = 4 / 16
        attraction[1 + mod(i + 1, 8)] = 4 / 16
        attraction[1 + i] = 6 / 16
        const pmf = new PMF(attraction)
        console.log('attraction', attraction, i)
        c.updateWalk(pmf)
      }
    }

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
      // map.gradientCircle(p, 10, c.color, c.coloringPercentage)
      this.painting.fadingGradientCircle(
        p,
        c.coloringSpread,
        c.color,
        c.coloringPercentage,
      )
      // map.gradientRectangle(
      //   p.x - 5,
      //   p.y - 5,
      //   CREATURE_SIZE + 10,
      //   CREATURE_SIZE + 10,
      //   c.color,
      //   COLORING_PERCENT,
      // )
    }

    const cpainting = this.painting.clone()

    // draw creatures
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i]!
      const p = c.position
      cpainting.rectangle(p.x, p.y, c.size, c.size, c.color)
    }

    if (DEBUG_VISUAL) {
      for (let x = SPACING; x < cpainting.width; x += SPACING) {
        cpainting.verticalLine(0, cpainting.height, x, new Color(0, 0, 0))
      }
      for (let y = SPACING; y < cpainting.height; y += SPACING) {
        cpainting.horizontalLine(0, cpainting.width, y, new Color(0, 0, 0))
      }
    }

    this.ctx.putImageData(cpainting.data, 0, 0)

    if (CONSTANT_TIME === 0) {
      requestAnimationFrame(() => {
        if (DEBUG_INFO) {
          perf(() => {
            this.drawLoop(map)
          })
        } else {
          this.drawLoop(map)
        }
      })
    }
  }

  addCreature(creature: Creature) {
    debug(`Adding creature ${JSON.stringify(creature)}`)
    this.creatures.push(creature)
  }
}
