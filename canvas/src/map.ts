import { Color } from './color'
import { DEBUG_VISUAL } from './constants'
import { type Creature } from './creature'
import { vec2, type Vector } from './vec'

/**
 * Map that uses spatial 'hashing' for efficiently dealing with creature interaction
 * Inspired by https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/11-hashing.html#L293
 */
export class Map {
  cellStart: Int32Array
  cellEntries: Int32Array
  queryIds: Int32Array
  querySize: number
  spacing: number

  creaturesSize: number
  creatures: Creature[]

  width: number
  height: number

  rowLength: number
  columnLength: number

  constructor(width: number, height: number, creatures: Creature[]) {
    this.width = width
    this.height = height
    // TODO: find a better spacing given width and height
    this.spacing = 50

    this.rowLength = Math.ceil(width / this.spacing)
    this.columnLength = Math.ceil(height / this.spacing)

    const size = this.rowLength * this.columnLength

    this.cellStart = new Int32Array(size)
    this.cellEntries = new Int32Array()
    this.queryIds = new Int32Array()
    this.querySize = 0
    this.creaturesSize = 0
    this.creatures = creatures
  }

  update() {
    // create new entries array with different size
    if (this.creatures.length > this.creaturesSize) {
      this.cellEntries = new Int32Array(this.creatures.length)
      this.queryIds = new Int32Array(this.creatures.length)
    }
    this.creaturesSize = this.creatures.length
    this.cellStart.fill(0)
    this.cellEntries.fill(0)

    for (const c of this.creatures) {
      const i = this.getIndex(c.position.vec)
      this.cellStart[i]++
    }

    let start = 0
    for (let i = 0; i < this.cellStart.length; i++) {
      start += this.cellStart[i]!
      this.cellStart[i] = start
    }

    for (let ci = 0; ci < this.creatures.length; ci++) {
      const i = this.getIndex(this.creatures[ci]!.position.vec)
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
    return (
      Math.floor(x / this.spacing) +
      Math.round(y / this.spacing) * this.rowLength
    )
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
      (index % this.rowLength) * this.spacing,
      Math.floor(index / this.rowLength) * this.spacing,
    ]
  }

  nearestNeighbors(
    i: number,
    distance: number,
  ): Iterator<[number, Vector<2>, number]> {
    const creatures = this.creatures
    const c = this.creatures[i]!

    const distanceSquared = distance ** 2
    const maxDistance = distanceSquared + this.spacing * 2

    const neigbors = this.nearestNeighborsFromGrid(i, distance)
    const w = this.width
    const h = this.height
    return {
      ids: neigbors.ids,
      size: neigbors.size,
      [Symbol.iterator]() {
        let i = -1

        const next: any = () => {
          i++
          if (i >= this.size) {
            return {
              value: undefined as unknown as [number, Vector<2>, number],
              done: true,
            }
          }
          const ni = this.ids[i]!
          const cn = creatures[ni]!
          const pn = cn.position

          let dir = pn.clone().sub(c.position)
          // update direction if direction to neighbor is wrapped around in space
          // if neighbor is wrapped around in space get the distance to mirrored map
          if (dir.mag2() > maxDistance) {
            const qc = quadrant(w, h, c.position)
            const qn = quadrant(w, h, cn.position)
            // correct neighbor position to mirror the location
            dir = pn
              .clone()
              .sub(getWrapCorrection(w, h, qc, qn))
              .sub(c.position)
          }

          const dirMag = pn.mag2()

          // if distance is bigger than range skip
          if (dir.mag2() > maxDistance) {
            return next()
          }

          return {
            value: [this.ids[i]!, dir, dirMag],
            done: false,
          }
        }

        return {
          next,
        }
      },
    }
  }

  nearestNeighborsFromGrid(
    i: number,
    // [x, y]: [number, number],
    distance: number,
  ): Iterator<number> {
    const [x, y] = this.creatures[i]!.position.vec
    this.querySize = 0

    const x0 = Math.floor((x - distance) / this.spacing)
    const y0 = Math.floor((y - distance) / this.spacing)

    const x1 = Math.floor((x + distance) / this.spacing)
    const y1 = Math.floor((y + distance) / this.spacing)

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
    for (let yi = y0; yi <= y1; yi++) {
      for (let xi = x0; xi <= x1; xi++) {
        const index = this.get(xi, yi)

        if (DEBUG_VISUAL) {
          const [sx, sy] = this.coordsFromIndex(index)
          window.simulation.painting.gradientRectangle(
            sx,
            sy,
            this.spacing,
            this.spacing,
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
          // skip current cell
          if (ci === i) continue
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

interface Iterator<V> {
  ids: Int32Array
  size: number
  [Symbol.iterator]: () => {
    next: () => {
      value: V
      done: boolean
    }
  }
}

function getWrapCorrection(w: number, h: number, qc: number, qn: number) {
  switch (qc) {
    case 0:
      switch (qn) {
        case 1:
          return vec2(-w, 0)
        case 2:
          return vec2(0, -h)
        case 3:
          return vec2(-w, -h)
      }
      throw Error(
        "neighbor can't be in the same quadrant if direction is above distance check",
      )
    case 1:
      switch (qn) {
        case 0:
          return vec2(w, 0)
        case 2:
          return vec2(w, -h)
        case 3:
          return vec2(0, -h)
      }
      throw Error(
        "neighbor can't be in the same quadrant if direction is above distance check",
      )
    case 2:
      switch (qn) {
        case 0:
          return vec2(0, h)
        case 1:
          return vec2(-w, h)
        case 3:
          return vec2(-w, 0)
      }
      throw Error(
        "neighbor can't be in the same quadrant if direction is above distance check",
      )
    case 3:
      switch (qn) {
        case 0:
          return vec2(w, h)
        case 1:
          return vec2(0, h)
        case 2:
          return vec2(w, 0)
      }
      throw Error(
        "neighbor can't be in the same quadrant if direction is above distance check",
      )
  }
  throw Error(
    "neighbor can't be in the same quadrant if direction is above distance check",
  )
}

/** get which quadrant a coord is returns 0 to 3 */
function quadrant(width: number, height: number, p: Vector<2>) {
  const [x, y] = p.vec
  let q = 0
  if (x > width / 2) {
    q += 1
  }
  if (y > height / 2) {
    q += 2
  }

  return q
}
