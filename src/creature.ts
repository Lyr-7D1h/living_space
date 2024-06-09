import { type Color } from './color'
import { type Vector, vec2 } from './vec'

export interface CreatureArgs {
  position: Vector<2>
  size: number
  color: Color
}

export const neighbors = [
  vec2(0, 0),
  vec2(1, 0),
  vec2(-1, 0),
  vec2(0, 1),
  vec2(0, -1),
  vec2(-1, -1),
  vec2(1, -1),
  vec2(-1, 1),
  vec2(1, 1),
]

export class Creature {
  position: Vector<2>
  size: number
  color: Color

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
