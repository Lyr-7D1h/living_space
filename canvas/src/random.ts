import { roundTwoDec } from './util'

export class PMF {
  p: number[]

  fromWeights(values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    const f = values.map((v) => v / sum)
    return new PMF(f)
  }

  constructor(p: number[]) {
    this.p = p
  }

  set(index: number, value: number) {
    this.p[index] = value
    // renormalize
    const sum = this.p.reduce((partialSum, a) => partialSum + a, 0)
    this.p = this.p.map((v) => v / sum)
  }

  [Symbol.iterator]() {
    return this.p[Symbol.iterator]()
  }

  cdf() {
    return CDF.fromPMF(this)
  }
}

export class CDF {
  f: number[]

  static fromPMF(pmf: PMF) {
    let a = 0

    const f = pmf.p.map((p) => {
      a += p
      return a
    })

    // account for floating point errors
    f[f.length - 1] = 1

    return new CDF(f)
  }

  static uniform(length: number) {
    const p: number[] = new Array(length).fill(roundTwoDec(1 / length))

    return CDF.fromPMF(new PMF(p))
  }

  /** Create a cdf from non normalized list of weights */
  static fromWeights(values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    let f = values.map((v) => v / sum)
    let a = 0
    f = f.map((p) => {
      a += p
      if (a > 1) a = 1
      return roundTwoDec(a)
    })
    // account for floating point errors
    f[f.length - 1] = 1
    return new CDF(f)
  }

  /** create cdf from numbers going up from 0 to 1 */
  constructor(f: number[]) {
    if (f[f.length - 1] !== 1) throw Error('Invalid cdf')
    this.f = f
  }

  [Symbol.iterator]() {
    return this.f[Symbol.iterator]()
  }

  /** draw a random number from pmf */
  draw() {
    const r = Math.random()
    return this.f.findIndex((p) => r < p)
  }
}
