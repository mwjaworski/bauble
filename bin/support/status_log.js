const spinners = require('cli-spinners')
const readline = require('readline')
const winston = require('winston')
const color = require('cli-color')

const Colors = {
  gray: color.xterm(8),
  yellow: color.yellow
}

const Spinner = {
  running: spinners.hamburger.frames
}

class StatusLog {
  static __drawLine (content) {
    if (this.__stream) {
      this.__stream.write(null, { ctrl: true, name: 'u' })
      this.__stream.write(content)
    }
  }

  static __drawContent () {
    const spinner = Spinner.running[this.__frame % Spinner.running.length]
    const seconds = parseInt(this.__frame / (1000 / this.__refreshRate), 10)

    return `${Colors.yellow(spinner)} ${Colors.gray(seconds + 's')} (${this.__action})`
  }

  static start () {
    this.__interval = setInterval(() => {
      this.__frame += 1
      this.__drawLine(this.__drawContent())
    }, this.__refreshRate)

    return this
  }

  static stop () {
    clearInterval(this.__interval)
    if (this.__stream) {
      this.__stream.write(null, { ctrl: true, name: 'u' })
    }

    return this
  }

  static initialize () {
    this.uninitialize()

    this.__logger = new (winston.Logger)({
      level: 'info',
      exitOnError: false,
      transports: [
        new (winston.transports.File)({
          timestamp: () => Date.now(),
          handleExceptions: true,
          filename: `vault.log`,
          json: false,
          options: {
            flags: 'w'
          }
        })
      ]
    })

    this.__stream = readline.createInterface({
      output: process.stdout,
      input: process.stdin,
      prompt: ``
    })

    return this
  }

  static uninitialize () {
    this.__logger = undefined
    this.__stream = undefined
    this.__refreshRate = 250
    this.__frame = 0
    this.__action = ''
    return this
  }

  static notify (action, resource, meta = {}) {
    this.__logger.info(`[${resource}] ${action}`, meta)
    this.__action = action
    return this
  }

  static error (action, resource, meta = {}) {
    this.__logger.error(`[${resource}] ${action}`, meta)
    this.__action = action
    return this
  }

  static completeSuccess () {
    this.__action = 'success'

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.stop().uninitialize())
      }, 1000)
    })
  }

  static completeFailure (reason) {
    this.__action = `${reason}`

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.stop().uninitialize())
      }, 1000)
    })
  }
}

module.exports = StatusLog
