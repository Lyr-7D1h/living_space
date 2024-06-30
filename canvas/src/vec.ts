import { roundTwoDec } from './util'

type NArray<N extends number> = N extends 1
  ? [number]
  : N extends 2
    ? [number, number]
    : number[]

type Y<N extends number> = N extends 3
  ? number
  : N extends 2
    ? number
    : undefined
type Z<N extends number> = N extends 3 ? number : undefined
// FIXME: make me not an object but just an array with util function and typing
export class Vector<N extends number> {
  vec: NArray<N>
  constructor(...vec: NArray<N>) {
    this.vec = vec
  }

  clone() {
    return new Vector<N>(...[...this.vec])
  }

  get(i: number) {
    return this.vec[i]!
  }

  set(i: number, v: number) {
    this.vec[i] = v
  }

  add(v: Vector<N>) {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] += v.get(i)
    }
    return this
  }

  /** normalize vector */
  norm() {
    const mag2 = this.mag2()
    if (mag2 === 0) return this
    // TODO: use https://en.wikipedia.org/wiki/Fast_inverse_square_root
    const a = 1 / Math.sqrt(mag2)
    if (a === 0) return this
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] *= a
    }
    return this
  }

  sub(v: Vector<N>) {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] -= v.get(i)
    }
    return this
  }

  roundTwoDec() {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] = roundTwoDec(this.vec[i]!)
    }
    return this
  }

  round() {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] = Math.round(this.vec[i]!)
    }
    return this
  }

  mul(s: number) {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] *= s
    }
    return this
  }

  floor() {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] = Math.floor(this.vec[i]!)
    }
    return this
  }

  scale(s: number) {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i] *= s
    }
    return this
  }

  /** magnitude squared */
  mag2(): number {
    let m = 0
    for (let i = 0; i < this.vec.length; i++) {
      m += this.get(i) ** 2
    }
    return m
  }

  sum(): number {
    let a = 0
    for (let i = 0; i < this.vec.length; i++) {
      a += this.get(i)
    }
    return a
  }

  get x() {
    return this.vec[0]
  }

  get y(): Y<N> {
    return this.vec[1] as Y<N>
  }

  get z(): Z<N> {
    return this.vec[2] as Z<N>
  }

  [Symbol.iterator]() {
    return this.vec[Symbol.iterator]()
  }
}
export function vec2(x: number, y: number) {
  return new Vector<2>(x, y)
}
export function vec<N extends number>(values: NArray<N>) {
  return new Vector<N>(...values)
}
