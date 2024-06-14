import { Color } from './color'
import { CDF } from './random'
import { type Vector, vec2 } from './vec'

export interface Characteristics {
  curiosity: number
  dominance: number
  friendliness: number
}

export type CreatureArgs =
  | {
      position: Vector<2>
      size: number
      color: Color
      coloringPercentage: number
      preference: CDF
      speed: number
    }
  | {
      position: Vector<2>
      size: number
      color: Color
      characteristics: Characteristics
    }

export const neighbors = [
  vec2(-1, -1),
  vec2(-1, 1),
  vec2(0, -1),
  vec2(-1, 0),
  vec2(0, 0),
  vec2(1, 0),
  vec2(0, 1),
  vec2(1, -1),
  vec2(1, 1),
]

export class Creature {
  position: Vector<2>
  size: number
  color: Color
  speed: number
  preference: CDF
  private prev: number

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    const preference = new CDF(
      ...Array.from({ length: 9 }, (_) => Math.floor(Math.random() * 50)),
    )
    return new Creature({
      position: vec2(x(), y()),
      color: new Color(c(), c(), c()),
      size: 2,
      preference,
      coloringPercentage: 0.01,
      speed: 1, // 1 + Math.round(Math.random() * 4),
      ...args,
    })
  }

  constructor(args: CreatureArgs) {
    this.position = args.position
    this.size = args.size
    this.color = args.color
    this.prev = 4
    if ('speed' in args) {
      this.speed = args.speed
      this.preference = args.preference
    } else {
      // TODO: add from chars
      this.speed = 0
      this.preference = new CDF()
    }
  }

  /** take a step into a direction based on characteristics */
  step() {
    // const probs = [80, 20, 0, 20, 20, 20, 20, 0, 20]
    // probs[this.prev] = 0
    const i = this.preference.draw()
    const m = neighbors[i]!
    this.position.add(m.clone().scale(this.speed))
    this.prev = i
  }
}
