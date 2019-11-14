// Config
export const config = {
  debug: false,
  emitWhenHidden: false
}

/** @param {object} newConfig @return {object} */
export function setConfig(newConfig) {
  Object.assign(config, newConfig)
  return config
}
