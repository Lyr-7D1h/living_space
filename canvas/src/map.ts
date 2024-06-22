import { Color } from './color'
import { DEBUG_INFO, DEBUG_VISUAL } from './constants'
import { type Creature } from './creature'

// TODO: find a better spacing given width and height
export const SPACING = 20

/**
 * Map that uses spatial 'hashing' for efficiently dealing with creature interaction
 * Inspired by https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/11-hashing.html#L293
 */
export class Map {
  cellStart: Int32Array
  cellEntries: Int32Array
  queryIds: Int32Array
  querySize: number

  creaturesSize: number

  width: number
  height: number

  rowLength: number
  columnLength: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height

    this.rowLength = Math.ceil(width / SPACING)
    this.columnLength = Math.ceil(height / SPACING)

    const size = this.rowLength * this.columnLength

    this.cellStart = new Int32Array(size)
    this.cellEntries = new Int32Array()
    this.queryIds = new Int32Array()
    this.querySize = 0
    this.creaturesSize = 0
  }

  update(creatures: Creature[]) {
    // create new entries array with different size
    if (creatures.length > this.creaturesSize) {
      this.cellEntries = new Int32Array(creatures.length)
      this.queryIds = new Int32Array(creatures.length)
    }
    this.creaturesSize = creatures.length
    this.cellStart.fill(0)
    this.cellEntries.fill(0)

    for (const c of creatures) {
      const i = this.getIndex(c.position.vec)
      this.cellStart[i]++
    }

    let start = 0
    for (let i = 0; i < this.cellStart.length; i++) {
      start += this.cellStart[i]!
      this.cellStart[i] = start
    }

    for (let ci = 0; ci < creatures.length; ci++) {
      const i = this.getIndex(creatures[ci]!.position.vec)
      this.cellStart[i]--
      this.cellEntries[this.cellStart[i]!] = ci
    }
  }

  /** get the index of a tile from normal cartesian coordiantes */
  getIndex([x, y]: [number, number]) {
    // wrap coords
    if (x < 0) x = this.width + x
    if (x > this.width - 1) x = x % this.width
    if (y < 0) y = this.height + y
    if (y > this.height - 1) {
      y = y % this.height
    }
    return Math.floor(x / SPACING) + Math.round(y / SPACING) * this.rowLength
  }

  /** get the index of a tile given row and column */
  get(i: number, j: number) {
    // wrap coords
    if (i < 0) i = this.rowLength + i
    if (i >= this.rowLength) i = i % this.rowLength
    if (j < 0) j = this.columnLength + j
    if (j >= this.columnLength) {
      j = j % this.columnLength
    }
    return i + j * this.rowLength
  }

  coordsFromIndex(index: number): [number, number] {
    return [
      (index % this.rowLength) * SPACING,
      Math.floor(index / this.rowLength) * SPACING,
    ]
  }

  nearestNeighbors([x, y]: [number, number], distance: number): Iterator {
    this.querySize = 0

    const x0 = Math.floor((x - distance) / SPACING)
    const y0 = Math.floor((y - distance) / SPACING)

    const x1 = Math.floor((x + distance) / SPACING)
    const y1 = Math.floor((y + distance) / SPACING)

    if (DEBUG_VISUAL) {
      window.simulation.painting.gradientRectangle(
        x - distance,
        y - distance,
        distance * 2,
        distance * 2,
        new Color(0, 255, 0),
        0.1,
      )
    }
    distance = distance ** 2
    for (let yi = y0; yi <= y1; yi++) {
      for (let xi = x0; xi <= x1; xi++) {
        const index = this.get(xi, yi)

        if (DEBUG_VISUAL) {
          const [sx, sy] = this.coordsFromIndex(index)
          window.simulation.painting.gradientRectangle(
            sx,
            sy,
            SPACING,
            SPACING,
            new Color(255, 0, 0),
            0.1,
          )
        }

        for (
          let j = this.cellStart[index]!;
          j < this.cellStart[index + 1]!;
          j++
        ) {
          const ci = this.cellEntries[j]!
          this.queryIds[this.querySize] = ci
          this.querySize++
        }
      }
    }

    return {
      ids: this.queryIds,
      size: this.querySize,
      [Symbol.iterator]() {
        let i = -1
        return {
          next: () => {
            i++
            if (i >= this.size) {
              return {
                value: 0,
                done: true,
              }
            }
            return {
              value: this.ids[i]!,
              done: false,
            }
          },
        }
      },
    }
  }
}

// TODO: Hash grid https://www.youtube.com/watch?v=D2M8jTtKi44

interface Iterator {
  ids: Int32Array
  size: number
  [Symbol.iterator]: () => {
    next: () => {
      value: number
      done: boolean
    }
  }
}
