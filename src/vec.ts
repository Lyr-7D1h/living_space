export class Vector<N extends number> {
  vec: number[]
  constructor(...vec: number[]) {
    this.vec = vec
  }

  get(i: number) {
    return this.vec[i]!
  }

  add(v: Vector<N>) {
    for (let i = 0; i < this.vec.length; i++) {
      this.vec[i]! += v.get(i)
    }
  }

  [Symbol.iterator]() {
    let i = -1

    return {
      map: this,
      next: function () {
        i++
        if (i > this.map.vec.length) {
          return { value: undefined, done: true }
        }

        return { value: this.map.get(i), done: false }
      },
    }
  }
}
export function vec2(x: number, y: number) {
  return new Vector<2>(x, y)
}
