const axios = require('axios')
const path = require('path')

const fileSystem = require('../support/file_system')

const applicationConfiguration = require('../configurations/application')
const paths = applicationConfiguration.get(`paths`)

class HTTPTransit {
  static sendToCache ({ uri, cachePath }) {
    return axios({
      responseType: `arraybuffer`,
      maxContentLength: 2000000,
      withCredentials: false,
      method: `get`,
      url: uri,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:22.0) Gecko/20100101 Firefox/22.0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then(response => {
      return fileSystem.write(cachePath, response.data).then(() => {
        return {
          cachePath
        }
      })
    })
  }
}

module.exports = HTTPTransit
