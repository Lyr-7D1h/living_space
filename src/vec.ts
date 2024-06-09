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
      this.vec[i]! += v.get(i)
    }
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
