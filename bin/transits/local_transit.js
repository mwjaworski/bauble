const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

const applicationConfiguration = require('../configurations/application')
const paths = applicationConfiguration.get(`paths`)

class LocalTransit {
  static getTagList (archiveRequest) {
    return new Promise((resolve, reject) => {
      resolve([])
    })
  }

  // TODO if we provide a file:// prefix then we have to tear it off
  static sendToCache (archiveRequest) {
    const originalLocation = this.__originalLocation(archiveRequest)
    const cachePath = this.__cachePath(archiveRequest)

    return new Promise((resolve, reject) => {
      fs.copy(originalLocation, cachePath, err => {
        if (err) {
          reject(new Error(err))
        } else {
          resolve({
            cachePath
          })
        }
      })
    })
  }

  static __originalLocation ({ uri }) {
    return _.trimEnd(`${uri}`)
  }

  static __cachePath ({ uri }) {
    const originalLocation = this.__originalLocation({ uri })
    const extension = path.extname(originalLocation)
    const zipFile = path.basename(originalLocation, extension)

    const cachePathZip = `${paths.cache}/${zipFile}${extension}`
    const cachePathFolder = `${paths.cache}/${path.basename(uri)}`

    return (_.size(extension) > 0) ? cachePathZip : cachePathFolder
  }
}

module.exports = LocalTransit