type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel) {
  return levelPriority[level] >= levelPriority[currentLevel]
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug('[debug]', ...args)
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info('[info]', ...args)
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn('[warn]', ...args)
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error('[error]', ...args)
  },
}


