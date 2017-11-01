'use strict'

const test = require('ava')
const TransitStrategy = require('../../bin/strategies/transit_strategy')

const LocalTransit = require('../../bin/transits/local_transit')
const HTTPTransit = require('../../bin/transits/http_transit')
const NullTransit = require('../../bin/transits/null_transit')

test.cb('strategy: io (valid uri)', t => {
  t.plan(4)

  t.is(TransitStrategy.of({ uri: `../../a/b/c` }), LocalTransit, 'folder uri is for LocalTransit')
  t.is(TransitStrategy.of({ uri: `../../a/b/c.zip` }), LocalTransit, 'folder zip uri is for LocalTransit')
  t.is(TransitStrategy.of({ uri: `http://a/b/c.zip` }), HTTPTransit, 'starting with http and ending with a zip is HTTPTransit')
  t.is(TransitStrategy.of({ uri: `https://a/b/c.zip` }), HTTPTransit, 'starting with https and ending with a zip is HTTPTransit')

  t.end()
})

test.cb('strategy: io (invalid uri)', t => {
  t.plan(2)

  t.is(TransitStrategy.of({ uri: `http://a/b/c` }), NullTransit, 'starting with http and ending with a folder is NullTransit')
  t.is(TransitStrategy.of({ uri: `https://a/b/c` }), NullTransit, 'starting with https and ending with a folder is NullTransit')

  t.end()
})