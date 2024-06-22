import { Color } from './color'
import { CDF, type PMF } from './random'
import { roundTwoDec } from './util'
import { type Vector, vec2 } from './vec'

export interface Characteristics {
  curiosity: number
  dominance: number
  friendliness: number
}

export type CreatureArgs = {
  position: Vector<2>
  size: number
  color: Color
} & (
  | {
      coloringPercentage: number
      coloringSpread: number
      preference: CDF
      speed: number
    }
  | {
      characteristics: Characteristics
    }
)

const directions = [
  vec2(0, 0),
  vec2(1, 0),
  vec2(1, 1),
  vec2(0, 1),
  vec2(-1, 1),
  vec2(-1, 0),
  vec2(-1, -1),
  vec2(0, -1),
  vec2(1, -1),
]

export class Creature {
  position: Vector<2>
  size: number
  color: Color
  coloringPercentage: number
  coloringSpread: number
  speed: number

  preference: CDF
  private walk: CDF

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    return new Creature({
      position: vec2(x(), y()),
      color: new Color(c(), c(), c()),
      size: 2,
      characteristics: {
        curiosity: Math.random(),
        dominance: Math.random(),
        friendliness: Math.random(),
      },
      ...args,
    })
  }

  constructor(args: CreatureArgs) {
    this.position = args.position
    this.size = args.size
    this.color = args.color
    if ('speed' in args) {
      this.speed = args.speed
      this.preference = args.preference
      this.coloringPercentage = args.coloringPercentage
      this.coloringSpread = args.coloringSpread
    } else {
      const c = args.characteristics
      // get all chars as a percentage of total
      const sum = c.curiosity + c.dominance + c.friendliness
      const curiosity = c.curiosity / sum
      const dominance = c.dominance / sum
      const friendliness = c.friendliness / sum

      this.speed = 1 + Math.round(4 * curiosity)
      this.coloringSpread = 10 - Math.round(3 * dominance)
      this.coloringPercentage = roundTwoDec(0.015 + 0.05 * dominance)
      this.preference = CDF.fromWeights(
        Array.from({ length: 9 }, (_) => Math.random()),
      )
    }
    this.walk = this.preference.clone()
  }

  /** update the way this creature walks */
  updateWalk(pmf: PMF) {
    console.log('walk update')
    console.log(this.walk.p)
    this.walk = this.preference.clone()
    this.walk.add(pmf)
    console.log(this.walk.p)
  }

  /** take a step into a direction based on characteristics */
  step() {
    const i = this.walk.draw()
    const m = directions[i]!
    this.position.add(m.clone().scale(this.speed))
  }
}
