export class Color {
  r: number
  g: number
  b: number

  constructor(r: number, g: number, b: number)
  constructor(...color: number[]) {
    this.r = color[0]!
    this.g = color[1]!
    this.b = color[2]!
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
    return this.normalize()
  }

  rgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }
}
