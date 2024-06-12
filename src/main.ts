import { setupCreator } from './creator'
import { Simulation } from './simulation'

export const simulation = new Simulation()
simulation.start()

setupCreator()

// allow acccess through console useful for debugging
window.simulation = simulation

setupCreator()
