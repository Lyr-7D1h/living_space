export class Color {
  c: number[] | Uint8ClampedArray

  static fromHex(hex: string) {
    const v = hex
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => '#' + r + r + g + g + b + b,
      )
      .substring(1)
      .match(/.{2}/g)!
      .map((x) => parseInt(x, 16))

    return new Color(v)
  }

  constructor(r: number, g: number, b: number, a?: number)
  constructor(color: number[] | Uint8ClampedArray)
  constructor(
    r: number | number[] | Uint8ClampedArray,
    g?: number,
    b?: number,
    a?: number,
  ) {
    if (r instanceof Uint8ClampedArray || Array.isArray(r)) {
      if (r.length === 3) {
        this.c = [...r, 255]
        return
      }
      if (r.length === 4) {
        this.c = r
        return
      }
      throw Error(`invalid length ${r.length} for color given`)
    }
    if (typeof g === 'undefined' || typeof b === 'undefined') {
      throw Error('Color has to have 3 or 4 elements')
    }
    this.c = [r, g, b, 255]
    if (typeof a !== 'undefined') this.c.push(a)
  }

  get r() {
    return this.c[0]!
  }

  set r(v: number) {
    this.c[0] = v
  }

  get g() {
    return this.c[1]!
  }

  set g(v: number) {
    this.c[1] = v
  }

  get b() {
    return this.c[2]!
  }

  set b(v: number) {
    this.c[2] = v
  }

  get a() {
    return this.c[3]!
  }

  set a(v: number) {
    this.c[3] = v
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b)
  }

  scale(s: number) {
    this.r *= s
    this.g *= s
    this.b *= s
    return this.normalize()
  }

  normalize() {
    this.r = Math.floor(this.r)
    this.g = Math.floor(this.g)
    this.b = Math.floor(this.b)
    return this
  }

  add(color: Color) {
    this.r += color.r
    this.g += color.g
    this.b += color.b
    return this
  }

  gradient(color: Color, percentage: number) {
    let d = color.r - this.r
    this.r += Math.sign(d) * Math.abs(d) * percentage
    d = color.g - this.g
    this.g += Math.sign(d) * Math.abs(d) * percentage
    d = color.b - this.b
    this.b += Math.sign(d) * Math.abs(d) * percentage
    d = color.a - this.a
    this.a += Math.sign(d) * Math.abs(d) * percentage
    return this.normalize()
  }

  rgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }

  u32() {
    return (this.r << 16) | (this.g << 8) | this.b
  }
}
