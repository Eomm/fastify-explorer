'use strict'

const fp = require('fastify-plugin')

function fastifyExplorer (fastify, opts, next) {
  const { optionKey = 'explorer' } = opts

  const pocket = new Map()

  fastify.addHook('onRegister', function fastifyExplorerTracker (instance, opts) {
    if (opts?.[optionKey]?.name) {
      if (pocket.has(opts[optionKey].name)) {
        throw new Error(`The instance named ${opts[optionKey].name} has been already registerd`)
      }
      pocket.set(opts[optionKey].name, instance)
    }
  })

  next()

  fastify.decorate('giveMe', function giveMe (instanceName, decorator) {
    const instance = pocket.get(instanceName)
    if (decorator && instance) {
      return instance[decorator]
    }
    return instance
  })

  fastify.decorate('registerPlugin', function mockPlugin (pluginFunc, pluginOpts, explorerOpts) {
    let expOpts = explorerOpts
    if (typeof explorerOpts === 'string') {
      expOpts = { [optionKey]: { name: explorerOpts } }
    }

    this.register(function middleware (layer, opts, next) {
      layer.register(pluginFunc, pluginOpts)
      next()
    }, expOpts)
  })

  next()
}

module.exports = fp(fastifyExplorer, {
  name: 'fastify-explorer',
  fastify: '^4.x'
})

module.exports.default = fastifyExplorer
module.exports.fastifyExplorer = fastifyExplorer
