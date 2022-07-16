'use strict'

const t = require('tap')
const test = t.test

const buildAppToTest = require('../example/application')

test('call my route', t => {
  t.plan(3)
  const fastify = buildAppToTest({ logger: false })
  fastify.inject('/my-route', (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'The doc is: null') // empty mongo :)
    fastify.close()
  })
})

test('call my route and fail', t => {
  t.plan(6)
  const fastify = buildAppToTest({ logger: false }, true)

  fastify.ready(err => {
    t.error(err)

    // this mongo instance would be unreachable
    const mongoInsideFastify = fastify.giveMe('routes-explorer', 'mongo')
    t.ok(mongoInsideFastify)

    // monkey patching only this instance, the next `buildAppToTest` call all will be cleared
    mongoInsideFastify.client.close(() => {
      t.pass('mongo instance closed')

      fastify.inject('/my-route', (err, res) => {
        t.error(err)
        t.equal(res.statusCode, 501) // this is a customized http status code
        t.same(res.json(), { ops: 'fail' }) // empty mongo :)
        fastify.close(() => {})
      })
    })
  })
})
