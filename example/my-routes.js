'use strict'

module.exports = (fastify, opts, next) => {
  fastify.get('/my-route', (req, reply) => {
    fastify.mongo.client
      .db('CuteDB')
      .collection('NiceCollection')
      .findOne({})
      .then(function (doc) {
        reply.send(`The doc is: ${JSON.stringify(doc)}`)
      })
      .catch(function (err) {
        reply.log.error(err)
        reply.code(501).send({ ops: 'fail' })
      })
  })
  next()
}
