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

    this.rowLength = Math.floor(width / SPACING)
    this.columnLength = Math.floor(height / SPACING)

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

    for (const c of creatures) {
      const i = this.getIndex(c.position.vec)
      this.cellStart[i]--
      this.cellEntries[this.cellStart[i]!] = i
    }
    console.log('update', this.cellStart, this.cellEntries)
  }

  getIndex([x, y]: [number, number]) {
    // wrap coords
    if (x < 0) x = this.width + x
    if (x > this.width - 1) x = x % this.width
    if (y < 0) y = this.height + y
    if (y > this.height - 1) {
      y = y % this.height
    }
    return Math.floor(x / SPACING) * Math.floor(y / SPACING)
  }

  nearestNeighbors([x, y]: [number, number], distance: number): Iterator {
    this.querySize = 0

    let xi = x - distance
    let yi = y - distance

    const x0 = x + distance
    const y0 = y + distance

    distance = distance ** 2
    for (yi; yi <= y0; yi += SPACING) {
      for (xi; xi <= x0; xi += SPACING) {
        const i = this.getIndex([xi, yi])

        window.simulation.ctx.fillStyle = 'rgb(255,0,0)'
        console.log(Math.floor((i * SPACING) % this.width))
        window.simulation.ctx.fillRect(
          Math.floor(i % this.rowLength) * SPACING,
          Math.floor(i / this.columnLength) * SPACING,
          20,
          20,
        )
        for (let j = this.cellStart[i]!; j < this.cellStart[i + 1]!; j++) {
          const ci = this.cellEntries[j]!

          // if (cx ** 2 + cy ** 2 <= distance) {
          this.queryIds[this.querySize] = ci
          this.querySize++
          // }
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
