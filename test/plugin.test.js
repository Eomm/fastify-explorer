'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fp = require('fastify-plugin')
const fastifyMongo = require('fastify-mongodb')
const fastifyExplorer = require('../index')

const plugin = (instance, opts, next) => {
  instance.decorate(`${opts.explorer && opts.explorer.name}Decor`, 'hello')
  next()
}

const fpPlugin = fp((instance, opts, next) => {
  instance.decorate(`${opts.explorer && opts.explorer.name}Decor`, 'hello')
  next()
})

test('Should load correctly the plugin', t => {
  t.plan(1)
  const app = Fastify()
  app.register(fastifyExplorer)
  app.ready(t.error)
})

test('Should throw when same names', t => {
  t.plan(2)
  const app = Fastify()
  app.register(fastifyExplorer)
  app.register(plugin, { explorer: { name: 'gemini' } })
  app.register(plugin, { explorer: { name: 'gemini' } })

  app.ready(err => {
    t.ok(err)
    t.like(err.message, 'already registerd')
  })
})

test('Should store the instances', t => {
  t.plan(6)
  const app = Fastify()
  app.register(fastifyExplorer)
  app.register(plugin, { explorer: { name: 'one' } })
  app.register(plugin, { explorer: { name: 'two' } })
  app.register(plugin) // ignored

  app.ready(err => {
    t.error(err)

    let instance = app.giveMe('one')
    t.equals(instance.oneDecor, 'hello')
    t.equals(instance.twoDecor, undefined)

    instance = app.giveMe('two')
    t.equals(instance.oneDecor, undefined)
    t.equals(instance.twoDecor, 'hello')

    instance = app.giveMe('not')
    t.equals(instance, undefined)
  })
})

test('It NOT store the plugin instances', t => {
  t.plan(5)
  const app = Fastify()
  app.register(fastifyExplorer)
  app.register(plugin, { explorer: { name: 'one' } })
  app.register(fpPlugin, { explorer: { name: 'two' } })
  app.register(fpPlugin) // ignored

  app.ready(err => {
    t.error(err)

    let instance = app.giveMe('one')
    t.equals(instance.oneDecor, 'hello')
    t.equals(instance.twoDecor, 'hello', 'the fp plugin has added the decorator to the main instance')

    instance = app.giveMe('two')
    t.equals(instance, undefined)

    instance = app.giveMe('not')
    t.equals(instance, undefined)
  })
})

test('It NOT store the instances if registered later', t => {
  t.plan(4)
  const app = Fastify()
  app.register(plugin, { explorer: { name: 'one' } })
  app.register(plugin, { explorer: { name: 'two' } })
  app.register(plugin) // ignored
  app.register(fastifyExplorer)

  app.ready(err => {
    t.error(err)

    let instance = app.giveMe('one')
    t.equals(instance, undefined)

    instance = app.giveMe('two')
    t.equals(instance, undefined)

    instance = app.giveMe('not')
    t.equals(instance, undefined)
  })
})

test('Should get the mongo instance with additional context layer', t => {
  t.plan(3)

  let theInstanceWithMongo
  const app = Fastify()
  app.register(fastifyExplorer)
  app.register((instance, opts, next) => {
    instance.register(fastifyMongo, { client: { fake: true } })
    theInstanceWithMongo = instance
    next()
  }, { explorer: { name: 'theMongo' } })

  app.ready(err => {
    t.error(err)

    const instance = app.giveMe('theMongo')
    t.ok(instance)

    const mongo = app.giveMe('theMongo', 'mongo')
    t.deepEquals(mongo, theInstanceWithMongo.mongo)
  })
})

test('Should use the utility to register an explorer plugin with shortcut', t => {
  t.plan(3)

  const app = Fastify()
  app.register(fastifyExplorer)
    .after(() => {
      app.registerPlugin(fastifyMongo, { client: { fake: true } }, 'theMongo')
    })

  app.ready(err => {
    t.error(err)

    const instance = app.giveMe('theMongo')
    t.ok(instance)

    const mongo = app.giveMe('theMongo', 'mongo')
    t.deepEquals(mongo.client, { fake: true })
  })
})

test('Should use the utility to register an explorer plugin', t => {
  t.plan(3)

  const app = Fastify()
  app.register(fastifyExplorer)
    .after(() => {
      app.registerPlugin(fastifyMongo, { client: { fake: true } }, { explorer: { name: 'theMongo' } })
    })

  app.ready(err => {
    t.error(err)

    const instance = app.giveMe('theMongo')
    t.ok(instance)

    const mongo = app.giveMe('theMongo', 'mongo')
    t.deepEquals(mongo.client, { fake: true })
  })
})

test('Decorator shortcut', t => {
  t.plan(6)
  const app = Fastify()
  app.register(fastifyExplorer)
  app.register(plugin, { explorer: { name: 'one' } })
  app.register(plugin, { explorer: { name: 'two' } })
  app.register(plugin) // ignored

  app.ready(err => {
    t.error(err)

    let val = app.giveMe('one', 'oneDecor')
    t.equals(val, 'hello')
    val = app.giveMe('one', 'twoDecor')
    t.equals(val, undefined)

    val = app.giveMe('two', 'oneDecor')
    t.equals(val, undefined)
    val = app.giveMe('two', 'twoDecor')
    t.equals(val, 'hello')

    val = app.giveMe('not', 'notDecor')
    t.equals(val, undefined)
  })
})
