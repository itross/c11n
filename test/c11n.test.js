'use strict'

const { test } = require('tap')
const loadConfig = require('..')

test('Should load config and get config object', async (t) => {
  t.plan(1)
  const config = await loadConfig({
    file: './c11n.config.json'
  })
  t.ok(config)
})

test('Should load config from project.name file name', async (t) => {
  t.plan(1)
  const config = await loadConfig()
  t.ok(config)
})

test('Should load secrets from AWS Secrets Manager', async (t) => {
  t.plan(1)
  const config = await loadConfig({ forceSecrets: true })
  console.log(`config: ${JSON.stringify(config, null, 2)}`)
  t.ok(config)
})
