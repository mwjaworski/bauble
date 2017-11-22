const applicationConfiguration = require('../configurations/application')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const is = require('is_js')

class ManifestConfiguration {
  static initialize () {
    this.__manifests = {}
    return this
  }

  static build (archivePath, forceUpdate) {
    this.__manifests[archivePath] = (!forceUpdate)
      ? this.__manifests[archivePath] || new ManifestConfiguration(archivePath)
      : new ManifestConfiguration(archivePath)

    return this.__manifests[archivePath]
  }

  constructor (archivePath) {
    this.assignManifest(archivePath)
  }

  assignManifest (archivePath) {
    const { configurationSystem, json, path } = this.__locatePrioritizedManifest(archivePath)

    this.__system = configurationSystem
    this.__manifest = json
    this.__path = path
  }

  __locatePrioritizedManifest (archivePath, configurationSystemList = applicationConfiguration.get(`rules.configurationSystem`)) {
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
    const configurationSystemList = applicationConfiguration.get(`rules.configurationSystem`)

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
    fs.writeFileSync(`./${this.__system.archiveManifest}`, JSON.stringify(this.__manifest, null, 2))
    return this
  }

  get path () {
    return this.__path || `vault.json`
  }

  get system () {
    return this.__system
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
