import { Color } from './color'
import { PMF } from './random'
import { type Vector, vec2 } from './vec'

export interface CreatureArgs {
  position: Vector<2>
  size: number
  color: Color
  preference: number[]
  speed: number
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
  private prev: number

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    const preference = Array.from({ length: 9 }, (_) =>
      Math.floor(Math.random() * 255),
    )
    return new Creature({
      position: vec2(x(), y()),
      color: new Color(c(), c(), c()),
      size: 2,
      preference,
      speed: 1 + Math.round(Math.random() * 4),
      ...args,
    })
  }

  constructor(args: CreatureArgs) {
    this.position = args.position
    this.size = args.size
    this.color = args.color
    this.speed = args.speed
    this.prev = 4
  }

  /** take a step into a direction based on characteristics */
  step() {
    const probs = [20, 20, 20, 5, 0, 5, 20, 20, 20]
    probs[this.prev] = 0
    const i = new PMF(...probs).draw()
    const m = neighbors[i]!
    this.position.add(m.clone().scale(this.speed))
    this.prev = i
  }
}
