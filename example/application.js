'use strict'

const Fastify = require('fastify')
const fastifyMongo = require('@fastify/mongodb')
const fastifyExplorer = require('../index')

const routes = require('./my-routes')

module.exports = function build (config, explorer) {
  const fastify = Fastify(config)

  if (explorer) {
    // the register must be the FIRST ONE
    fastify.register(fastifyExplorer)
  }

  fastify.register(fastifyMongo, {
    url: 'mongodb://127.0.0.1:27017/CuteDB'
  })
  fastify.register(routes, { explorer: { name: 'routes-explorer' } })

  return fastify
}
