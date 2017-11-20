const FileSystem = require('../support/file_system')
const JSZip = require('jszip')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

class ZipPackage {
  static pack(archiveBundle, manifestConfiguration) {
    return this.__packZip(archiveBundle, FileSystem.flattenFolder(archiveBundle.releaseFolder))
      .generateAsync({
        compression: 'deflate',
        type: 'nodebuffer',
        platform: 'UNIX'
      })
      .then((content) => {
        FileSystem.write(`${archiveBundle.releaseStaging}.zip`, content)
      })
  }
  static __packZip(archiveBundle, fileList) {
    const zip = new JSZip();

    fileList.forEach(filePath => {
      const aspects = filePath.split(path.sep)
      const [file, extension] = _.last(aspects).split(`.`)

      let addZipOptions
      let readFileOptions

      switch (extension) {
        case 'gif':
        case 'jpg':
        case 'png':
          addZipOptions = {
            base64: true
          }
          readFileOptions = {
            encoding: 'base64'
          }
          break;
        default:
          addZipOptions = {
            base64: false
          }
          readFileOptions = {
            encoding: 'utf8'
          }
      }

      // TODO figure out how we allow this to be configured...
      zip.file(
        `${archiveBundle.archive}${path.sep}${archiveBundle.version}${path.sep}${filePath}`,
        fs.readFileSync(filePath, readFileOptions),
        addZipOptions
      );
    })

    return zip
  }

  static unpack(archiveRequest, cachePath) {
    return FileSystem
      .read(archiveRequest.cachePath)
      .then((binaryData) => {
        return this.__unpackZip(binaryData, archiveRequest)
      })
  }
  static __unpackZip(binaryData, {
    stagingPath,
    archive
  }, msg) {
    return JSZip
      .loadAsync(binaryData)
      .then(function (zip) {
        const filesWritten = []

        zip.forEach((relativePath, file) => {
          const archivePrefix = `${archive}`

          if (relativePath.indexOf(archivePrefix) === 0) {
            relativePath = relativePath.substr(`${archivePrefix}/`.length)
          }

          const isFolder = relativePath.lastIndexOf(`/`) === relativePath.length - 1
          const stagingFilePath = `${stagingPath}/${relativePath}`

          if (isFolder) {
            FileSystem.createDirectory(stagingFilePath)
          } else {
            filesWritten.push(
              new Promise(resolve => {
                const writeStream = fs.createWriteStream(stagingFilePath)

                writeStream.on(`close`, () => {
                  resolve()
                })

                file.nodeStream().pipe(writeStream)
              })
            )
          }
        })

        return Promise
          .all(filesWritten)
          .then(() => {
            return {}
          })
      })
  }
}

module.exports = ZipPackage
