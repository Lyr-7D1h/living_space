export const CONSTANTS = {
  CONTROLLER_URL: import.meta.env.VITE_CONTROLLER_URL,
  SYNC_SERVER_URL: import.meta.env.VITE_SYNC_SERVER_URL,
  DEBUG_INFO: import.meta.env.VITE_DEBUG_INFO === 'true',
  ASSERTS: import.meta.env.VITE_ASSERTS === 'true',
  DEBUG_VISUAL: import.meta.env.VITE_DEBUG_VISUAL === 'true',
  CONSTANT_TIME_S: Number(import.meta.env.VITE_CONSTANT_TIME_S),
  COUNT_START_CREATURES: Number(import.meta.env.VITE_COUNT_START_CREATURES),
  QR: import.meta.env.VITE_QR === 'true',
  PING_TIMEOUT: Number(import.meta.env.VITE_PING_TIMEOUT),
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
