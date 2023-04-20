'use strict'
// this file is only a luncher
const buildApp = require('./application')
const server = buildApp({ logger: true })

server.listen({ port: 3000 }, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})
