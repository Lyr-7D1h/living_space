import { ASSERTS } from './constants'
import { roundTwoDec } from './util'

/** https://en.wikipedia.org/wiki/Probability_mass_function */
export class PMF {
  p: number[]

  /** create pmf from non normalized list of numbers */
  fromWeights(values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    const f = values.map((v) => v / sum)
    return new PMF(f)
  }

  /** create pmf from normalized list (all numbers add to 1)  */
  constructor(p: number[]) {
    if (ASSERTS) {
      const sum = p.reduce((a, b) => a + b)
      console.assert(sum === 1, sum)
    }
    this.p = p
  }

  [Symbol.iterator]() {
    return this.p[Symbol.iterator]()
  }

  cdf() {
    return CDF.fromPMF(this)
  }
}

/** https://en.wikipedia.org/wiki/Cumulative_distribution_function */
export class CDF {
  p: number[]
  f: number[]

  static fromPMF(pmf: PMF) {
    return new CDF(pmf.p)
  }

  static uniform(length: number) {
    const p: number[] = new Array(length).fill(roundTwoDec(1 / length))

    return new CDF(p)
  }

  /** Create a cdf from non normalized list of numbers */
  static fromWeights(values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    const p = values.map((v) => roundTwoDec(v / sum))
    return new CDF(p)
  }

  /** create cdf from probabilities going up from 0 to 1 */
  constructor(p: number[]) {
    this.p = p
    this.f = this.fromProbabilities(p)
  }

  private fromProbabilities(p: number[]) {
    let a = 0
    const f = p.map((p) => {
      a += p
      if (a > 1) return 1
      return roundTwoDec(a)
    })

    // account for floating point errors
    f[f.length - 1] = 1

    return f
  }

  [Symbol.iterator]() {
    return this.f[Symbol.iterator]()
  }

  clone() {
    return new CDF([...this.p])
  }

  updateWeight(index: number, p: number) {
    this.p[index] = p
    const cdf = CDF.fromWeights(this.p)
    this.f = cdf.f
    this.p = cdf.p
  }

  add(pmf: PMF): void
  add(cdf: CDF): void
  add(fun: PMF | CDF) {
    const p = fun.p

    for (let i = 0; i < this.p.length; i++) {
      this.p[i] = roundTwoDec((this.p[i]! + p[i]!) / 2)
    }

    this.f = this.fromProbabilities(this.p)
  }

  /** draw a random number from pmf */
  draw() {
    const r = Math.random()
    return this.f.findIndex((p) => r < p)
  }
}
