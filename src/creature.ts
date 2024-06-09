import { Color } from './color'
import { type Vector, vec2 } from './vec'

export interface CreatureArgs {
  position: Vector<2>
  size: number
  color: Color
  preference: number[]
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
      ...args,
    })
  }

  constructor(args: CreatureArgs) {
    this.position = args.position
    this.size = args.size
    this.color = args.color
  }

  /** take a step into a direction based on characteristics */
  step() {
    const m = neighbors[Math.floor(Math.random() * neighbors.length)]!
    this.position.add(m)
  }
}
