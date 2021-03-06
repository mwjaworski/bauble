const ApplicationConfiguration = require('../configurations/application')
const FileSystem = require('../support/file_system')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const is = require('is_js')

class ManifestConfiguration {
  static initialize () {
    this.__manifests = {}
    return this
  }

  static build (archivePath) {
    const manifest = this.__manifests[archivePath] = this.__manifests[archivePath] || new ManifestConfiguration()
    return manifest.assignManifest(archivePath)
  }

  assignManifest (archivePath) {
    const configurationSystemList = (this.__system)
      ? [this.__system]
      : ApplicationConfiguration.get(`rules.configurationSystem`)

    const { configurationSystem, json, path } = this.__locatePrioritizedManifest(archivePath, configurationSystemList)

    this.__system = this.__system || configurationSystem
    this.__manifest = json
    this.__path = path
    return this
  }

  __locatePrioritizedManifest (archivePath, configurationSystemList) {
    if (!archivePath) {
      return this.__emptyManifest()
    }

    for (const configurationSystem of configurationSystemList) {
      const json = fs.readJsonSync(`${archivePath}/${configurationSystem.archiveManifest}`, {
        throws: false
      })

      if (json) {
        return {
          configurationSystem,
          json: this.__initialize(json),
          path: `${archivePath}/${configurationSystem.archiveManifest}`
        }
      }
    }

    return this.__emptyManifest()
  }

  __emptyManifest () {
    const configurationSystemList = ApplicationConfiguration.get(`rules.configurationSystem`)

    return {
      configurationSystem: _.find(configurationSystemList, (system) => system.archiveManifest === `vault.json`),
      json: this.__defaultManifest(),
      path: ``
    }
  }

  initialize () {
    this.__manifest = this.__initialize(this.__manifest)
    return this
  }

  __initialize (json = {}) {
    return _.merge({}, this.__defaultManifest(), json)
  }

  __defaultManifest () {
    return {
      name: '',
      version: '',
      dependencies: {},
      devDependencies: {},
      resolutions: {},
      externals: [],
      ignore: []
    }
  }

  initializeLocal () {
    this.initialize()

    this.__manifest.name = this.__manifest.name || _.last(process.cwd().split(path.sep))
    this.__manifest.version = this.__manifest.version || `0.1.0`
    return this
  }

  /**
   *
   */
  initializeLocalRelease ({ releaseFolder, releaseReference }) {
    this.initializeLocal()

    this.__manifest.release = {
      ref: releaseReference || this.releaseReference,
      folder: releaseFolder || this.releaseFolder
    }

    return this
  }

  saveLocal () {
    FileSystem.writeFile(`./${this.__system.archiveManifest}`, JSON.stringify(this.__manifest, null, 2))
    return this
  }

  get path () {
    return this.__path || `vault.json`
  }

  get system () {
    return this.__system
  }

  set system (_system) {
    this.__system = _.find(ApplicationConfiguration.get(`rules.configurationSystem`), (system) => system.toolName === _system)
  }

  set releaseFolder (_folder) {
    this.__setSafeProp(`release.folder`, _folder, '')
  }

  get releaseFolder () {
    return this.__getSafeProp(`release.folder`, '')
  }

  set releaseReference (_ref) {
    this.__setSafeProp(`release.ref`, _ref, `-`)
  }

  get releaseReference () {
    return this.__getSafeProp(`release.ref`, `-`)
  }

  set name (_name) {
    this.__setSafeProp(`name`, _name, ``)
  }

  get name () {
    return this.__getSafeProp(`name`, ``)
  }

  get version () {
    return this.__getSafeProp(`version`, ``)
  }

  allDependencies () {
    return _.merge({}, this.dependencies(), this.devDependencies())
  }

  dependencies () {
    return this.__getSafeProp(`dependencies`, {})
  }

  applyResolutions (_resolutions) {
    this.__setSafeProp(`resolutions`, _.mapValues(_resolutions, `installedVersion`), this.resolutions())
  }

  resolutions () {
    return this.__getSafeProp(`resolutions`, {})
  }

  devDependencies () {
    return this.__getSafeProp(`devDependencies`, {})
  }

  externals () {
    return this.__getSafeProp(`externals`, [])
  }

  ignore () {
    return this.__getSafeProp(`ignore`, [])
  }

  __setSafeProp (property, val, defaultValue) {
    _.set(this.__manifest, property, (is.sameType(val, defaultValue)) ? val : defaultValue)
  }

  __getSafeProp (property, defaultValue) {
    const val = _.get(this.__manifest, property)

    return (is.sameType(val, defaultValue)) ? val : defaultValue
  }
}

module.exports = ManifestConfiguration.initialize()
