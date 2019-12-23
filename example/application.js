'use strict'

const Fastify = require('fastify')
const fastifyMongo = require('fastify-mongodb')
const fastifyExplorer = require('../index')

const routes = require('./my-routes')

module.exports = function build (config, explorer) {
  const fastify = Fastify(config)

  if (explorer) {
    // the register must be the FIRST ONE
    fastify.register(fastifyExplorer)
  }

  fastify.register(fastifyMongo, { url: 'mongodb://localhost:27017/' })
  fastify.register(routes, { explorer: { name: 'routes-explorer' } })

  return fastify
}
