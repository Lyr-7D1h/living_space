import { Color } from './color'
import { CONSTANTS } from './constants'
import { Creature } from './creature'
import { debug } from './log'
import { vec } from './vec'
import { Rasterizer } from './rasterizer'
import { Debug } from './debug'
import { Map } from './map'
import { mod } from './math'
import { PMF } from './random'

const debugEl = new Debug()

function perf(cb: () => void) {
  const start = Date.now()
  cb()
  const d = Date.now() - start
  if (CONSTANTS.DEBUG_INFO) {
    debugEl.set('fps', `${Math.round(1000 / d)}`)
    debugEl.set('delay', `${d}ms`)
  }
}

/** responsible for building and rendering the entire simulated world */
export class Simulation {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  painting: Rasterizer
  creatures: Creature[]

  constructor() {
    this.canvas = document.getElementById('root')! as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight

    debug(`Created ${this.ctx.canvas.width}x${this.ctx.canvas.height} canvas`)

    this.creatures = []

    for (let i = 0; i < CONSTANTS.COUNT_START_CREATURES; i++) {
      this.creatures.push(Creature.random())
    }

    this.painting = new Rasterizer(
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

        this.addCreature(Creature.random({ position: vec(x, y) }))
      },
      false,
    )
  }

  private draw() {
    const map = new Map(this.canvas.width, this.canvas.height, this.creatures)

    // initialize canvas with white pixels, looks slightly better on borders
    this.painting.rectangle(
      0,
      0,
      this.painting.width,
      this.painting.height,
      new Color(255, 255, 255),
    )

    if (CONSTANTS.CONSTANT_TIME_S > 0) {
      setInterval(() => {
        this.drawLoop(map)
      }, CONSTANTS.CONSTANT_TIME_S * 1000)

      return
    }
    requestAnimationFrame(() => {
      if (CONSTANTS.DEBUG_INFO) {
        perf(() => {
          this.drawLoop(map)
        })
      } else {
        this.drawLoop(map)
      }
    })
  }

  private drawLoop(map: Map) {
    if (CONSTANTS.DEBUG_INFO) {
      debugEl.set('pixels', this.creatures.length)
    }

    map.update()

    this.updateCreatureAttraction(map)

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

    if (CONSTANTS.DEBUG_VISUAL) {
      for (let x = map.spacing; x < cpainting.width; x += map.spacing) {
        cpainting.verticalLine(0, cpainting.height, x, new Color(0, 0, 0))
      }
      for (let y = map.spacing; y < cpainting.height; y += map.spacing) {
        cpainting.horizontalLine(0, cpainting.width, y, new Color(0, 0, 0))
      }
    }

    this.ctx.putImageData(cpainting.data, 0, 0)

    if (CONSTANTS.CONSTANT_TIME_S === 0) {
      requestAnimationFrame(() => {
        if (CONSTANTS.DEBUG_INFO) {
          perf(() => {
            this.drawLoop(map)
          })
        } else {
          this.drawLoop(map)
        }
      })
    }
  }

  /** for each creature check for neirest neighbors and update walking direction */
  private updateCreatureAttraction(map: Map) {
    for (let ci = 0; ci < this.creatures.length; ci++) {
      const c = this.creatures[ci]!
      for (const [cni, dir, dirMag2] of map.nearestNeighbors(
        ci,
        CONSTANTS.CREATURE_VIEWDISTANCE,
      )) {
        if (dirMag2 < c.size ** 2) {
          const args = c.procreate(this.creatures[cni]!)
          if (args !== null) {
            this.addCreature(new Creature(this.creatures.length, args))
          }
          console.log('Collision')
        }
        const theta = Math.atan2(dir.y, dir.x)
        if (CONSTANTS.DEBUG_VISUAL) {
          const { x: x0, y: y0 } = c.position
          const { x: x1, y: y1 } = c.position
            .clone()
            .add(dir.norm().scale(30).round())
          // console.log(y0, y1, dir.norm().scale(30).round().vec)
          this.painting.line(x0, y0, x1, y1, new Color(0, 255, 0))
        }
        // angle from -pi to pi
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
        c.updateWalk(pmf)
      }
    }
  }

  addCreature(creature: Creature) {
    debug('Adding creature ')
    console.log(JSON.stringify(creature))

    this.creatures.push(creature)
  }
}
