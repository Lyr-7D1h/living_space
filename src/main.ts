import { Simulation } from './simulation'

const simulation = new Simulation()
simulation.start()

// allow acccess through console
window.simulation = simulation
