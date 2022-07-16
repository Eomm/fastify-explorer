'use strict'

const fp = require('fastify-plugin')

function fastifyExplorer (fastify, opts, next) {
  const pocket = new Map()

  fastify.addHook('onRegister', function fastifyExplorerTracker (instance, opts) {
    if (opts.explorer && opts.explorer.name) {
      if (pocket.has(opts.explorer.name)) {
        throw new Error(`The instance named ${opts.explorer.name} has been already registerd`)
      }
      pocket.set(opts.explorer.name, instance)
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
      expOpts = { explorer: { name: explorerOpts } }
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
