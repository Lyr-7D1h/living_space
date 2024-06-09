export class PMF {
  f: number[]
  constructor(...values: number[]) {
    const sum = values.reduce((partialSum, a) => partialSum + a, 0)
    this.f = values.map((v) => v / sum)
  }

  [Symbol.iterator]() {
    return this.f[Symbol.iterator]()
  }

  cdf() {
    return CDF.fromPdf(this)
  }

  /** draw a random number from pmf */
  draw() {
    console.log(CDF.fromPdf(this))
    return CDF.fromPdf(this).draw()
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
    this.f = values
  }

  [Symbol.iterator]() {
    return this.f[Symbol.iterator]()
  }

  /** draw a random number from pmf */
  draw() {
    const r = Math.random()
    return this.f.findIndex((p) => r < p)!
  }
}
