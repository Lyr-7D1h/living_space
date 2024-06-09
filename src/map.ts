import { Color } from './color'
import { TILE_SIZE } from './constants'
import { debug } from './log'
import { type Vector, vec2 } from './vec'

export class Map {
  data: Color[][]
  tWidth: number
  tHeight: number
  private readonly cWidth: number
  private readonly cHeight: number

  constructor(width: number, height: number) {
    const rowLength = Math.ceil(width / TILE_SIZE)
    const columnLength = Math.ceil(height / TILE_SIZE)
    console.log(rowLength, columnLength)
    const row = Array.from(
      { length: rowLength },
      (_) => new Color(255, 255, 255),
    )
    this.data = Array.from({ length: columnLength }, (_) => [...row])
    // const d = width - rowLength * TILE_SIZE
    this.tWidth = TILE_SIZE // + Math.floor(d / rowLength)
    this.tHeight = TILE_SIZE // + Math.floor(d / columnLength)
    this.cWidth = width
    this.cHeight = height
    debug(
      `Created ${row.length}x${this.data.length} map with ${this.tWidth}x${this.tHeight} tiles`,
    )
  }

  get tileWidth() {
    return this.tWidth
  }

  get tileHeight() {
    return this.tHeight
  }

  get width() {
    return this.data[0]!.length
  }

  get height() {
    return this.data.length
  }

  [Symbol.iterator]() {
    let i = -1
    let j = 0

    return {
      map: this,
      next: function () {
        i++
        if (j === this.map.height && i === this.map.width) {
          return { value: undefined, done: true }
        }

        i++
        if (i > this.map.width) {
          i = 0
          j++
        }
        return { value: [i, j], done: false }
      },
    }
  }

  index(p: Vector<2>) {
    const { x, y } = p
    if (x < 0 || x > this.cWidth - 1 || y < 0 || y > this.cHeight - 1) {
      throw Error(
        `Invalid xy coordinates ${x} ${y} are outside of ${this.cWidth} ${this.cHeight}`,
      )
    }
    return vec2(Math.floor(x / this.tWidth), Math.floor(y / this.tHeight))
  }

  get(p: Vector<2>): Color {
    const { x: i, y: j } = p
    if (i < 0 || i > this.width - 1 || j < 0 || j > this.height - 1) {
      throw Error(
        `Invalid ij coordinates ${i} ${j} are outside of ${this.width} ${this.height}`,
      )
    }
    return this.data[j]![i]!
  }

  set(p: Vector<2>, color: Color) {
    const { x: i, y: j } = p
    this.data[j]![i] = color
  }

  /** returns [x,y,w,h] */
  getTileDimensions(i: number, j: number): number[] {
    return [i * this.tWidth, j * this.tHeight, this.tWidth, this.tHeight]
  }
}
