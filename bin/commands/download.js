const createArchiveRequestAction = require('../actions/create_resource_request_action')
const downloadArchiveAction = require('../actions/download_archive_action')
const AuditLog = require('../support/audit_log')

module.exports = {
  registerVorpalCommand: (vorpal, applicationConfiguration) => {
    return vorpal
      .command(`download <reference>`)
      .option('-a, --audit', `Inspect the tools selected for a reference`)
      .description(`Download an archive.`)
      .validate(function (args) {
        return true
      })
      .action((args, done) => {

        const { reference } = args
        // TODO download works on one archive at a time, try `all` for every package? or *
        // TODO evaluate how useful audit is and how it works with a full install

        if (args.options.audit) {
          return createArchiveRequestAction(reference)
            .then(({
              archiveRequest,
              TransitTool,
              PackageTool
            }) => {
              vorpal.log(
                AuditLog.variableValue({
                  uri: archiveRequest.uri,
                  version: archiveRequest.version,
                  archive: archiveRequest.archive,
                  io: TransitTool.name,
                  package: PackageTool.name
                })
              )
            })
            .then(() => done())
        }

        downloadArchiveAction(reference, vorpal)
          .catch(err => {
            vorpal.log(err.toString())
          })
          .then(() => {
            return done()
          })
      })
  }
}
