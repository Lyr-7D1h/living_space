export function message(
  type: 'error' | 'info' | 'warn',
  message: string,
  timeout?: number,
): HTMLElement {
  const messageElement = document.createElement('div')
  messageElement.classList.add(`message-${type}`, 'message')
  messageElement.textContent = message

  const html = document.getElementById('messages')
  html?.appendChild(messageElement)

  if (timeout !== undefined) {
    setTimeout(() => {
      messageElement.remove()
    }, timeout * 1000)
  }

  return messageElement
}

export function info(msg: any, permanent?: boolean): HTMLElement {
  if (typeof msg !== 'string') {
    msg = JSON.stringify(msg)
  }
  console.info(msg)
  return message('info', msg as string, permanent === true ? undefined : 8)
}

export function warn(msg: any, permanent?: boolean): HTMLElement {
  if (typeof msg !== 'string') {
    msg = JSON.stringify(msg)
  }
  console.warn(msg)
  return message('warn', msg as string, permanent === true ? undefined : 8)
}

export function error(msg: any, permanent?: boolean): HTMLElement {
  if (msg instanceof Error) {
    msg = msg.message
  } else if (typeof msg !== 'string') {
    msg = JSON.stringify(msg)
  }
  console.error(msg)
  return message('error', msg as string, permanent === true ? undefined : 8)
}

export function roundTwoDec(n: number) {
  return parseFloat(n.toFixed(2))
  // gives very small decimal numbers when adding numbers
  // return Math.round((n + Number.EPSILON) * 100) / 100
}

export function roundFourDec(n: number) {
  return parseFloat(n.toFixed(4))
  // gives very small decimal numbers when adding numbers
  // return Math.round((n + Number.EPSILON) * 100) / 100
}
