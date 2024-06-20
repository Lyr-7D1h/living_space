// use p5 as ref https://p5js.org/reference/#/p5.Image

import { type Color } from './color'
import { type Vector } from './vec'

// https://github.dev/ronikaufman/poetical_computer_vision/blob/main/days01-10/day01/day01.pde
export class ImageBuffer {
  data: ImageData
  buffer: Uint8ClampedArray

  constructor(data: ImageData) {
    this.data = data
    this.buffer = data.data
  }

  clone() {
    return new ImageBuffer(
      new ImageData(
        new Uint8ClampedArray(this.data.data),
        this.data.width,
        this.data.height,
      ),
    )
  }

  get width() {
    return this.data.width
  }

  get height() {
    return this.data.height
  }

  fill(x: number, y: number, dx: number, dy: number, c: Color) {
    const v = [c.r, c.g, c.b, 255]
    const width = this.data.width * 4
    for (let o = y * width; o <= (y + dy) * width; o += width) {
      for (let d = x * 4; d <= (x + dx) * 4; d++) {
        this.buffer[o + d] = v[d % 4]!
      }
    }
  }

  gradientRectangle(
    x: number,
    y: number,
    dx: number,
    dy: number,
    c: Color,
    percentage: number,
  ) {
    const v = [c.r, c.g, c.b, 255]
    const width = this.data.width * 4
    for (let o = y * width; o <= (y + dy) * width; o += width) {
      for (let d = x * 4; d <= (x + dx) * 4; d++) {
        const i = o + d
        const diff = v[d % 4]! - this.buffer[i]!
        // console.log(Math.sign(diff) * Math.abs(diff) * percentage)
        this.buffer[i] += Math.sign(diff) * Math.abs(diff) * percentage
      }
    }
  }

  fadingGradientCircle(p: Vector<2>, r: number, c: Color, percentage: number) {
    let x = r
    let y = 0
    let d = 1 - x
    while (x >= y) {
      let fadingPerc = percentage * (Math.abs(1 + r - y) / r)
      this.fadingGradientHorizontalLine(p.x - x, 2 * x, p.y + y, c, fadingPerc)
      if (y !== 0) {
        this.fadingGradientHorizontalLine(
          p.x - x,
          2 * x,
          p.y - y,
          c,
          fadingPerc,
        )
      }

      y++
      if (d > 0) {
        if (x >= y) {
          fadingPerc = percentage * (Math.abs(r - x + 1) / r)
          this.fadingGradientHorizontalLine(
            p.x - y + 1,
            2 * y - 1,
            p.y - x,
            c,
            fadingPerc,
          )
          this.fadingGradientHorizontalLine(
            p.x - y + 1,
            2 * y - 1,
            p.y + x,
            c,
            fadingPerc,
          )
        }
        // go down
        x--
        d += 2 * (y - x + 1)
      } else {
        // go east
        d += 2 * y + 1
      }
    }
  }

  fadingGradientHorizontalLine(
    x: number,
    dx: number,
    y: number,
    c: Color,
    percentage: number,
  ) {
    const mid = dx / 2
    const o = y * this.width * 4
    for (let xi = 0; xi < dx; xi++) {
      const xo = (x + xi) * 4 + o
      const fadingPerc = percentage * (1 - Math.abs((mid - xi) / mid))
      for (let i = 0; i < 4; i++) {
        const diff = c.c[i % 4]! - this.buffer[i]!
        this.buffer[xo + i] += Math.sign(diff) * Math.abs(diff) * fadingPerc
      }
    }
  }

  /** https://en.wikipedia.org/wiki/Midpoint_circle_algorithm */
  gradientCircle(p: Vector<2>, r: number, c: Color, percentage: number) {
    let x = r
    let y = 0
    let d = 1 - x
    while (x >= y) {
      this.gradientHorizontalLine(p.x - x, 2 * x, p.y + y, c, percentage)
      if (y !== 0) {
        this.gradientHorizontalLine(p.x - x, 2 * x, p.y - y, c, percentage)
      }

      y++
      if (d > 0) {
        if (x >= y) {
          this.gradientHorizontalLine(
            p.x - y + 1,
            2 * y - 1,
            p.y - x,
            c,
            percentage,
          )
          this.gradientHorizontalLine(
            p.x - y + 1,
            2 * y - 1,
            p.y + x,
            c,
            percentage,
          )
        }
        // go down
        x--
        d += 2 * (y - x + 1)
      } else {
        // go east
        d += 2 * y + 1
      }
    }
  }

  gradientHorizontalLine(
    x: number,
    dx: number,
    y: number,
    c: Color,
    percentage: number,
  ) {
    const o = y * this.width * 4
    for (let i = x * 4 + o; i < (x + dx) * 4 + o; i++) {
      const diff = c.c[i % 4]! - this.buffer[i]!
      this.buffer[i] += Math.sign(diff) * Math.abs(diff) * percentage
    }
  }

  horizontalLine(x: number, dx: number, y: number, c: Color) {
    // const o = y * this.width * 4
    // for (let i = x * 4 + o; i < (x + dx) * 4 + o; i++) {
    //   this.buffer[i] += c.c[i % 4]!
    // }
    for (let xi = x; xi < x + dx; xi++) {
      this.set(xi, y, c)
      // this.buffer[i] += c.c[i % 4]!
    }
  }

  verticalLine(y: number, dy: number, x: number, c: Color) {
    // const o = x * 4
    // const width = this.width
    for (let yi = y; yi < y + dy; yi++) {
      this.set(x, yi, c)
      // this.buffer[i] += c.c[i % 4]!
    }
  }

  set(x: number, y: number, value: Color): void
  set(
    x: number,
    y: number,
    dx: number | Color,
    dy?: number,
    value?: Uint8ClampedArray[],
  ): void {
    if (
      typeof value !== 'undefined' &&
      typeof dy !== 'undefined' &&
      typeof dx === 'number'
    ) {
      const width = this.data.width * 4
      let i = 0
      let j = 0
      for (let o = y * width; o <= (y + dy) * width; o += width) {
        for (let d = x * 4; d <= (x + dx) * 4; d++) {
          this.buffer[o + d] = value[j]![i]!
          i++
        }
        j++
      }
      return
    }

    let i = x * 4 + y * this.width * 4
    const j = i + 4
    for (i; i < j; i++) {
      this.buffer[i] = (dx as Color).c[i % 4]!
    }
  }

  get(x: number, y: number): Uint8ClampedArray
  get(x: number, y: number, dx: number, dy: number): Uint8ClampedArray[]
  get(
    x: number,
    y: number,
    dx?: number,
    dy?: number,
  ): Uint8ClampedArray | Uint8ClampedArray[] {
    if (typeof dx !== 'undefined' && typeof dy !== 'undefined') {
      const width = this.width * 4
      const r = []
      for (let o = y * width; o <= (y + dy) * width; o += width) {
        r.push(this.buffer.slice(o + x * 4, o + (x + dx) * 4))
      }
      return r
    }

    const width = this.data.width
    const i = y * width * 4 + x * 4
    return this.buffer.slice(i, i + 4)
  }
}
