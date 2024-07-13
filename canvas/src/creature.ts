import { Color } from './color'
import { CDF, type PMF } from './random'
import { roundTwoDec } from './util'
import { Vector, vec } from './vec'

/** https://en.wikipedia.org/wiki/Big_Five_personality_traits */
export interface Personality {
  /** cautious - curious */
  openness: number
  /** careless - organized */
  conscientiousness: number
  /** reserved - energetic */
  extraversion: number
  /** judgemental- compassionate */
  agreeableness: number
  /** nervous - confident */
  neuroticism: number
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
      attraction: number
    }
  | {
      personality: Personality
    }
)

const directions = [
  vec(0, 0),
  vec(1, 0),
  vec(1, 1),
  vec(0, 1),
  vec(-1, 1),
  vec(-1, 0),
  vec(-1, -1),
  vec(0, -1),
  vec(1, -1),
]

export class Creature {
  position: Vector<2>
  size: number
  color: Color
  coloringPercentage: number
  coloringSpread: number
  speed: number
  // a number from -1 to 1 indicating if it should be attracted or repulsed
  attraction: number

  preference: CDF
  private walk: CDF

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    return new Creature({
      position: vec(x(), y()),
      color: new Color(c(), c(), c()),
      size: 2,
      personality: {
        openness: Math.random(),
        conscientiousness: Math.random(),
        extraversion: Math.random(),
        agreeableness: Math.random(),
        neuroticism: Math.random(),
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
      this.attraction = args.attraction
    } else {
      const personality = args.personality

      const sum = new Vector(Object.values(args.personality) as number[]).sum()

      const openness = personality.openness / sum
      const conscientiousness = personality.conscientiousness / sum
      const extraversion = personality.extraversion / sum
      const agreeableness = personality.agreeableness / sum
      const neuroticism = personality.neuroticism / sum

      this.speed = 1 + Math.round(4 * (extraversion * 0.8 + neuroticism * 0.2))
      this.coloringSpread = 10 - Math.round(3 * openness)
      this.coloringPercentage = roundTwoDec(0.015 + 0.05 * (1 - neuroticism))

      // make dot be more stubborn in how it walks
      const preference = vec(
        ...Array.from({ length: 9 }, (_) => Math.random()),
      ).roundTwoDec()
      const mean = preference.mean()
      preference
        .mutmap((p) => {
          // p = p * (1 - {diff with mean} * {stretching multiplier})
          // so when diff is positive, it is bigger than mean it will stretch up
          // if negative it will shrink down
          return p * (1 - (mean - p) * (1 + conscientiousness))
        })
        .roundTwoDec()
      this.preference = CDF.fromWeights(preference)

      this.attraction = 1 - agreeableness * 2
    }
    this.walk = this.preference.clone()
  }

  /** update the way this creature walks */
  updateWalk(pmf: PMF) {
    // console.log('walk update')
    // console.log(this.walk.p)
    this.walk = this.preference.clone().add(pmf)
    // console.log(this.walk.p)
  }

  /** returns a new creature or null if they don't like eachother */
  procreate(creature: Creature): Creature | null {
    // TODO: procreation
    return null
  }

  /** take a step into a direction based on behavioral walk */
  step() {
    const i = this.walk.draw()
    const m = directions[i]!
    this.position.add(m.clone().scale(this.speed))
  }
}
