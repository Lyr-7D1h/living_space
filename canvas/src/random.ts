import { roundTwoDec } from './util'

export class PMF {
  f: number[]

  constructor(...values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    this.f = values.map((v) => v / sum)
    console.log(this.f)
  }

  set(index: number, value: number) {
    this.f[index] = value
    // renormalize
    const sum = this.f.reduce((partialSum, a) => partialSum + a, 0)
    this.f = this.f.map((v) => v / sum)
  }

  [Symbol.iterator]() {
    return this.f[Symbol.iterator]()
  }

  cdf() {
    return CDF.fromPdf(this)
  }
}

export class CDF {
  f: number[]

  static fromPdf(pmf: PMF) {
    let a = 0

    const cdf = pmf.f.map((p) => {
      a += p
      return a
    })

    // account for floating point errors
    cdf[cdf.length - 1] = 1

    return new CDF(...cdf)
  }

  /** create cdf from numbers going up from 0 to 1 */
  constructor(...values: number[]) {
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
