// use p5 as ref https://p5js.org/reference/#/p5.Image

import { type Color } from './color'
import { Vector } from './vec'

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

  gradient(
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

  gradientCircle(p: Vector<2>, radius: number, c: Color, percentage: number) {}

  set(
    x: number,
    y: number,
    dx: number,
    dy: number,
    value: Uint8ClampedArray[],
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
