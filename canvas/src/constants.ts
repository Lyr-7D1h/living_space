export const CONSTANTS = {
  CONTROLLER_URL: 'http://localhost:7541/controller',
  SYNC_SERVER_URL: 'ws://localhost:7543',
  DEBUG_INFO: true,
  ASSERTS: false,
  DEBUG_VISUAL: false,
  CONSTANT_TIME_S: 0,
  COUNT_START_CREATURES: 0,
}

for (const key in CONSTANTS) {
  const urlParam = new URLSearchParams(window.location.search).get(key)
  if (urlParam !== null) {
    if (typeof CONSTANTS[key]! === 'boolean') {
      CONSTANTS[key] = urlParam === 'true'
    } else if (typeof CONSTANTS[key]! === 'number') {
      CONSTANTS[key] = parseFloat(urlParam)
    } else {
      CONSTANTS[key] = urlParam
    }
  }
}
