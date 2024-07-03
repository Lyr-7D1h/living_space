import { roundTwoDec } from './util'

type Y<N extends number> = N extends 3
  ? number
  : N extends 2
    ? number
    : undefined
type Z<N extends number> = N extends 3 ? number : undefined

type GrowToSize<
  T,
  N extends number,
  A extends T[],
  L extends number = A['length'],
> = L extends N ? A : L extends 999 ? T[] : GrowToSize<T, N, [...A, T]>

export type FixedArray<N extends number> = GrowToSize<number, N, number[]>

export class Vector<N extends number> extends Array<number> {
  constructor(...items: [number[] & { length: N }])
  constructor(...items: number[] & { length: N })
  // constructor(...items: [number[]])
  constructor(...items: number[])
  constructor(
    ...items: [number[] & { length: N }] | (number[] & { length: N })
  ) {
    if (typeof items[0] === 'undefined') {
      throw Error("can't create empty vector")
    }
    if (typeof items[0] === 'number') {
      super(...(items as number[]))
    } else {
      super(...(items[0] as number[]))
    }
    Object.setPrototypeOf(this, Vector.prototype)
  }

  override get length(): N {
    return super.length as N
  }

  override push(): number {
    throw new Error('Cannot add items to FixedSizeArray')
  }

  override pop(): number | undefined {
    throw new Error('Cannot remove items from FixedSizeArray')
  }

  clone() {
    return new Vector<N>(
      ...([...this] as GrowToSize<number, N, [], 0> & {
        [Symbol.iterator]: () => any
      }),
    )
  }

  /** mutable mapping oftor values */
  mutmap(
    callbackfn: (value: number, index: number, array: number[]) => number,
  ) {
    for (let i = 0; i < this.length; i++) {
      this[i] = callbackfn(this[i]!, i, this)
    }
    return this
  }

  get(i: number) {
    return this[i]!
  }

  set(i: number, v: number) {
    this[i] = v
  }

  add(v: Vector<N>) {
    for (let i = 0; i < this.length; i++) {
      this[i] += v[i]!
    }
    return this
  }

  /** normalize */
  norm() {
    const mag2 = this.mag2()
    if (mag2 === 0) return this
    // TODO: use https://en.wikipedia.org/wiki/Fast_inverse_square_root
    const a = 1 / Math.sqrt(mag2)
    if (a === 0) return this
    for (let i = 0; i < this.length; i++) {
      this[i] *= a
    }
    return this
  }

  sub(v: Vector<N>) {
    for (let i = 0; i < this.length; i++) {
      this[i] -= v.get(i)
    }
    return this
  }

  roundTwoDec() {
    for (let i = 0; i < this.length; i++) {
      this[i] = roundTwoDec(this[i]!)
    }
    return this
  }

  round() {
    for (let i = 0; i < this.length; i++) {
      this[i] = Math.round(this[i]!)
    }
    return this
  }

  mul(s: number) {
    for (let i = 0; i < this.length; i++) {
      this[i] *= s
    }
    return this
  }

  floor() {
    for (let i = 0; i < this.length; i++) {
      this[i] = Math.floor(this[i]!)
    }
    return this
  }

  scale(s: number) {
    for (let i = 0; i < this.length; i++) {
      this[i] *= s
    }
    return this
  }

  /** airthmetic mean */
  mean(): number {
    return this.average()
  }

  /** airthmetic average */
  average(): number {
    return this.sum() / this.length
  }

  /** magnitude squared */
  mag2(): number {
    let m = 0
    for (let i = 0; i < this.length; i++) {
      m += this.get(i) ** 2
    }
    return m
  }

  sum(): number {
    let a = 0
    for (let i = 0; i < this.length; i++) {
      a += this.get(i)
    }
    return a
  }

  get x(): number {
    return this[0]!
  }

  get y(): Y<N> {
    return this[1] as Y<N>
  }

  get z(): Z<N> {
    return this[2] as Z<N>
  }
}

export function vec<N extends number>(
  ...items: [number[] & { length: N }]
): Vector<N>
export function vec<N extends number>(
  ...items: [...number[]] & { length: N }
): Vector<N>
export function vec<N extends number>(...items: [...number[]]): Vector<N>
export function vec<N extends number>(
  ...items: [number[] & { length: N }] | (number[] & { length: N })
) {
  // : (Vector<N> & FixedArray<N>) | Vector<N>
  return new Vector<N>(...(items as number[])) // as Vector<N> & FixedArray<N>
}
