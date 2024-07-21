import { Color } from './color'
import { mod } from './math'
import { CDF } from './random'
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
  color: Color
  ancestors: Set<number>
  personality: Personality
}

const directions = [
  vec(0, 0),
  vec(1, 0),
  vec(1, -1),
  vec(0, -1),
  vec(-1, -1),
  vec(-1, 0),
  vec(-1, 1),
  vec(0, 1),
  vec(1, 1),
]

export class Creature {
  name: number
  ancestors: Set<number>
  position: Vector<2>
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
  walk: CDF

  static random(args?: Partial<CreatureArgs>) {
    const x = () => Math.floor(Math.random() * window.innerWidth)
    const y = () => Math.floor(Math.random() * window.innerHeight)
    const c = () => Math.floor(Math.random() * 255)
    const rand = () => Math.floor(Math.random() * 100)
    return new Creature(Math.random(), {
      position: vec(x(), y()),
      color: new Color(c(), c(), c()),
      ancestors: new Set(),
      personality: {
        openness: rand(),
        conscientiousness: rand(),
        extraversion: rand(),
        agreeableness: rand(),
        neuroticism: rand(),
      },
      ...args,
    })
  }

  constructor(name: number, args: CreatureArgs) {
    this.name = name
    this.ancestors = args.ancestors
    this.position = args.position
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

    this.attraction = roundTwoDec((personality.conscientiousness - 50) / 50)
    this.walk = this.preference.clone()
    this.viewport = 0.25 + extraversion

    this.personality = personality
  }

  /** gets run on each simulation update */
  update() {
    this.walk = this.preference
  }

  /** update the way this creature walks compared to direction of neighbor */
  updateWalk(dir: Vector<2>) {
    // angle from -pi to pi, negative y because y is down
    const atan2 = Math.atan2(-dir.y, dir.x)
    // angle from 0 to 2pi
    const theta = mod(atan2, 2 * Math.PI)
    // offset angle by 1/8 of a circle to fit within a 1/8th piece, wrap around if above 2 pi
    // find index by splitting the circle in 8 pieces and seeing where the angle lands
    const i = Math.floor(mod(theta + Math.PI / 8, 2 * Math.PI) / (Math.PI / 4))
    const calcAttraction = (mul: number) => {
      // calculate how much it moves in this direction based on attraction
      // if attraction is negative, it will move away from the direction
      const r = 1 / 8 + 2 * mul * this.attraction
      if (r < 0) {
        return 1
      }
      return 1 + r
    }

    // multiply preference by an attraction multiplier
    const attraction = [...this.preference.p] // offset by 1 because creatures can also stay in position
    attraction[1 + mod(i - 4, 8)] *= calcAttraction(-3 / 8)
    attraction[1 + mod(i - 3, 8)] *= calcAttraction(-1 / 8)
    attraction[1 + mod(i + 3, 8)] *= calcAttraction(-1 / 8)
    attraction[1 + mod(i - 2, 8)] *= 1 / 8
    attraction[1 + mod(i + 2, 8)] *= 1 / 8
    attraction[1 + mod(i - 1, 8)] *= calcAttraction(1 / 8)
    attraction[1 + mod(i + 1, 8)] *= calcAttraction(1 / 8)
    attraction[1 + i] *= calcAttraction(3 / 8)

    this.walk = CDF.fromWeights(attraction)
  }

  /** returns a new creature or null if they don't like eachother */
  procreate(creature: Creature): CreatureArgs | null {
    // can't procreate with ancestors
    // console.log(creature.ancestors, this.ancestors)
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
      this.attraction *= 0.9
      creature.attraction *= 0.9
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
