'use strict'

const loadConfig = require('..')

async function start () {
  const config = await loadConfig({
    file: './example.config.json'
  })
  console.log(`config: ${JSON.stringify(config, null, 2)}`)
}

start()
