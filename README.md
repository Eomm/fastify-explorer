# fastify-explorer
Explore your fastify instances.

If you understand how to use this plugin, you will archive the higher knowledge in the fastify encapsulation mechanism ✨

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/Eomm/fastify-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/Eomm/fastify-explorer/actions/workflows/ci.yml)

> **Note**  
> To deep dive the fastify encapsulation, you may want to try the [fastify-overview](https://github.com/Eomm/fastify-overview) plugin as well.

## Install

```
npm install fastify-explorer --save-dev
```

### Compatibility

| Plugin version | Fastify version |
| ------------- |:---------------:|
| `^1.0.0` | `^2.0.0` |
| `^2.0.0` | `^4.0.0` |


## Usage

The plugin will store a pointer to the fastify instances you are interested in, created with the `.register` function that will have the `explorer` configuration.
__This operation will break the encapsulation and you must be confident with the plugin system.__

**Note that this plugin has been developed for testing purposes.**


### Use case: testing

Let me show how I develop this plugin:

Usually, I need to read data from a DB, like mongodb, and if you want 100% coverage, you need to
test the `error` case that usually is archived mocking the data or even the db driver.

So I prefer to get the mongodb connection of my fastify server.. and close it to let it throws!
The encapsulation hides the registered plugins unless using this plugin 😈

This is only an example, but you can get whatever decorator is attached to all the fastify instances!
**Read the code-comments to have a complete overview of this plugin**.

Moroever, this plugin forces you to develop your application with a solid pattern. Let's see it:

#### `application.js`: factory pattern

This is the main file of your app, here you must create the fastify server and register plugins and routes.
Remember: don't call `.listen` but simply return your server!

Note that this plugin must be the first one to be registered.


```js
const Fastify = require('fastify')
const fastifyMongo = require('@fastify/mongodb')
const fastifyExplorer = require('fastify-explorer')

const routes = require('./my-routes')

module.exports = function build (config, explorer) {
  const fastify = Fastify(config.server)

  // use it only for test. if you don't nothing bad happens, only waste of RAM
  if (explorer === true) {
    // the register must be the FIRST ONE
    fastify.register(fastifyExplorer)
  }

  fastify.register(fastifyMongo, { url: config.mongoUrl })

  // To activate the plugin, you need to add and `explorer` config in registration phase
  // If you don't register the plugin, the parameters are just ignored
  fastify.register(routes, { explorer: { name: 'routes-explorer' } })

  return fastify
}
```

#### `server.js`: launcher

Now you can run your application with [`fastify-cli`](https://github.com/fastify/fastify-cli/) or with the following code.
This file is a dumb file.. so we don't need to test it!

```js
const buildApp = require('./application')
const conf = require('./config.json') 
const server = buildApp(conf)

server.listen(3000, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})
```

#### Test

Finally, we can test our code!
Note how our test is like the launcher.

```js
const { test } = require('tap')

const buildApp = require('./application')
const conf = require('./config-test.json') 
const server = buildApp(conf)

test('call my route and fail', t => {
  t.plan(4)
  const fastify = buildApp(conf, true) // we pass TRUE only in test!

  fastify.ready(err => {
    t.error(err)

    // this mongo instance would be unreachable because hidden in the encapsulated context
    const mongoInsideFastify = fastify.giveMe('routes-explorer', 'mongo')

    // let's close the connection, so our routes will break!
    mongoInsideFastify.client.close()

    fastify.inject('/my-route', (err, res) => {
      t.error(err)
      t.equals(res.statusCode, 501) // this is a customized http status code
      t.deepEquals(res.json(), {}) // empty mongo :)
    })
  })
})
```


## API

This plugin adds two decorators to the fastify instance:

- `giveMe(instanceName: string[, decoratorName: string])`: return the fastify instance registered with given name in parameters `{ explorer: { name: 'routes-explorer' } }`
- `registerPlugin(pluginFunction: function, pluginOpts: object, explorerOpts: string|object)`: register a plugin adding an encapsulation layer. It is only a shortcut to create new fastify contexts.

You can find an example for `.giveMe` in this document.

### Why `registerPlugin`?

This plugin works only when you register an encapsulated context. The `fastify-plugin` system breaks the encapsulation.. so this plugin wouldn't work with normal plugins!
In other words, the `onRegister` hook is called only when **new** contexts are created, and the plugins don't create new contexts!

Here to you and example:

```js
app.register(fastifyExplorer)
  .after(() => {
    // use the decorator to register mongo
    app.registerPlugin(fastifyMongo, { url: '...' }, 'theMongo')
  })
```

I don't like this usage because it will impact too much on how you write your `application.js` file.


### Another important question

Somebody could ask: why pass the `explorer` parameters in the route's registration and not in mongo in `application.js`?
You should know it right now 👎🏼

As explained in the `registerPlugin`'s section, it is useless writing because it doesn't work:

```js
fastify.register(fastifyMongo, { url: config.mongoUrl }, { explorer: { name: 'mongo-code' } })
```

So, I have configured the `explorer` parameters in the routes because that code will create a new context that would have access to the mongo instance!
It seems tricky, but I think it is right, because I have named the routes I want to break: I'm not interested to the plugins itself.


## You

If you have read all this documentation, you are great and I hope you have understood better the encapsulation context and how to play with it.


## Future

I'm thinking how to test complex scenarios like this one, where you want to break only the first `findOne` call and not the second one.

```js
fastify.get('/', async (req, res) => {
  try {
    const hello = await fastify.mongo.findOne({ _id: 'an-id' })
  } catch(err) {
    mqtt.publish('woooooo')
    const world = await fastify.mongo.findOne({ _id: 'an-id-2' })
  }
})
```


## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
