import { Color } from './color'
import { CDF, type PMF } from './random'
import { roundFourDec, roundTwoDec } from './util'
import { Vector, vec } from './vec'

/** https://en.wikipedia.org/wiki/Big_Five_personality_traits */
export interface Personality {
  /** cautious - curious */
  openness: number
  /** careless - caring */
  conscientiousness: number
  /** introverted - extraverted */
  extraversion: number
  /** judgemental- compassionate */
  agreeableness: number
  /** sensitive - confident */
  neuroticism: number
}

export interface CreatureArgs {
  position: Vector<2>
  size: number
  color: Color
  ancestors: Set<number>
  personality: Personality
}

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
  name: number
  ancestors: Set<number>
  position: Vector<2>
  size: number
  color: Color
  coloringPercentage: number
  coloringSpread: number
  speed: number
  // a number from -1 to 1 indicating if it should be attracted or repulsed
  attraction: number
  // number from 0 to 1 indicating how far it can view from its max viewing distance
  viewport: number
  personality: Personality

  preference: CDF
  private walk: CDF

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    return new Creature(Math.random(), {
      position: vec(x(), y()),
      color: new Color(c(), c(), c()),
      size: 2,
      ancestors: new Set([]),
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

  constructor(name: number, args: CreatureArgs) {
    this.name = name
    this.ancestors = args.ancestors
    this.position = args.position
    this.size = args.size
    this.color = args.color
    const personality = args.personality

    const sum = new Vector(Object.values(args.personality) as number[]).sum()

    const openness = personality.openness / sum
    const conscientiousness = personality.conscientiousness / sum
    const extraversion = personality.extraversion / sum
    const agreeableness = personality.agreeableness / sum
    const neuroticism = personality.neuroticism / sum

    this.speed = 1 + Math.round(4 * extraversion + 2 * openness)
    this.coloringSpread = 10 + Math.round(10 * agreeableness)
    this.coloringPercentage = roundFourDec(0.015 + 0.05 * neuroticism)

    // make dot be more stubborn in how it walks
    const preference = vec(
      ...Array.from({ length: 9 }, (_) => Math.random()),
    ).roundTwoDec()
    const mean = preference.mean()
    const stretch = 1 + 0.2 * (1 - conscientiousness) + 0.8 * neuroticism
    preference
      .mutmap((p) => {
        // p = p * (1 - {diff with mean} * {stretching multiplier})
        // so when diff is positive, it is bigger than mean it will stretch up
        // if negative it will shrink down
        return p * (1 - (mean - p) * stretch)
      })
      .roundTwoDec()
    // add +/- 50% to the preference of the creature to make it more stubborn
    preference[0] *= 1.5 - openness
    this.preference = CDF.fromWeights(preference)

    this.attraction = roundTwoDec(1 - conscientiousness * 2)
    this.walk = this.preference.clone()
    this.viewport = extraversion

    this.personality = personality
  }

  /** update the way this creature walks */
  updateWalk(pmf: PMF) {
    // console.log(pmf, this.attraction)
    vec(pmf.p).mutmap((p) => p * this.attraction)
    // console.log(pmf)
    this.walk = this.preference.clone().add(pmf)
  }

  /** returns a new creature or null if they don't like eachother */
  procreate(creature: Creature): CreatureArgs | null {
    // can't procreate with ancestors
    if (
      creature.ancestors.has(this.name) ||
      this.ancestors.has(creature.name)
    ) {
      return null
    }
    if (Math.random() < this.personality.agreeableness / 100) {
      const ancestors = this.ancestors.union(creature.ancestors)
      ancestors.add(this.name)
      ancestors.add(creature.name)
      return {
        ancestors,
        position: this.position.clone(),
        size: (this.size + creature.size) / 2,
        color: this.color.mix(creature.color),
        personality: {
          openness:
            (this.personality.openness + creature.personality.openness) / 2,
          conscientiousness:
            (this.personality.conscientiousness +
              creature.personality.conscientiousness) /
            2,
          extraversion:
            (this.personality.extraversion +
              creature.personality.extraversion) /
            2,
          agreeableness:
            (this.personality.agreeableness +
              creature.personality.agreeableness) /
            2,
          neuroticism:
            (this.personality.neuroticism + creature.personality.neuroticism) /
            2,
        },
      }
    }
    return null
  }

  /** take a step into a direction based on behavioral walk */
  step() {
    const i = this.walk.draw()
    const m = directions[i]!
    this.position.add(m.clone().scale(this.speed))
  }
}
