'use strict'

require('dotenv').config()
const { readFileSync } = require('fs')
const { resolve } = require('path')
const Ajv = require('ajv')
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager')

process.env.NODE_ENV ||= 'development'

const isEnvVar = (s) => /^{{/i.test(s) && /}}$/i.test(s)
const envVarName = (e) => e.replace('{{', '').replace('}}', '')
const isProd = ['prod', 'production'].includes(process.env.NODE_ENV)
const isDev = ['dev', 'development'].includes(process.env.NODE_ENV)
const isTest = process.env.NODE_ENV === 'test'

async function loadConfig (opts = {}) {
  let fileName = opts.file
  if (!fileName) {
    const packageJson = require(resolve('package.json'))
    if (!packageJson || !packageJson.name) {
      throw new Error('No "file" in opts and missing package.json file or missing "name" field in package.json.')
    }
    fileName = packageJson.name.startsWith('@') ? `${packageJson.name.split('/')[1]}.config.json` : `${packageJson.name}.config.json`
    console.log(`FILENAME: ${fileName}`)
  }

  let awsClient
  const getSecret = async function (key, envvar) {
    if (isProd || opts.forceSecrets) {
      try {
        if (!awsClient) {
          awsClient = new SecretsManagerClient({ region: process.env.AWS_REGION })
        }
        const response = await awsClient.send(new GetSecretValueCommand({ SecretId: key }))
        return JSON.parse(response.SecretString)
      } catch (err) {
        throw new Error(`${err.message} - KEY: ${key}`)
      }
    }
    return Promise.resolve(process.env[envvar])
  }

  const mergeEnv = async function (obj) {
    for (const k in obj) {
      if (typeof obj[k] === 'object') {
        await mergeEnv(obj[k])
      } else if (Array.isArray(obj[k])) {
        obj[k].forEach(async (e) => await mergeEnv(e))
      } else {
        if (isEnvVar(obj[k])) {
          const envName = envVarName(obj[k])
          let envVal
          if (/env:.+,key:.+/i.test(envName) || /key:.+,env:.+/i.test(envName)) {
            const parts = envName.split(',')
            let subEnvName
            let subKeyName
            if (/env:.+/i.test(parts[0])) {
              subEnvName = parts[0].split(':')[1]
              subKeyName = parts[1].split(':')[1]
            } else {
              subEnvName = parts[1].split(':')[1]
              subKeyName = parts[0].split(':')[1]
            }
            envVal = await getSecret(subKeyName, subEnvName)
          } else if (/env:.+/i.test(envName)) {
            throw new Error(`missing key: for ${envName}`)
          } else if (/key:.+/i.test(envName)) {
            throw new Error(`missing env: for ${envName}`)
          } else {
            envVal = process.env[envName]
          }

          if (envVal === undefined) {
            throw new Error(`undefined ${envName} environment variable.`)
          }
          obj[k] = envVal
        }
      }
    }
  }

  // start all

  const config = JSON.parse(readFileSync(resolve(fileName)))

  await mergeEnv(config)

  config.app = {
    env: process.env.NODE_ENV,
    isProd,
    isDev,
    isTest,
    ...config.app
  }

  if (opts.schema) {
    // validate(opts.schema, config)
    const ajv = new Ajv({ coerceTypes: true })
    if (!ajv.validate(opts.schema, config)) {
      const errors = ajv.errors.map(e => {
        return {
          property: e.instancePath,
          message: e.message
        }
      })
      throw new Error(`Malformed configuration file. Schema validation failed: ${JSON.stringify(errors)}`)
    }
  }

  return config
}

module.exports = loadConfig

// async function test () {
//   const config = await loadConfig({
//     schema: {
//       type: 'object',
//       properties: {
//         server: {
//           type: 'object',
//           properties: {
//             host: { type: 'string' },
//             port: { type: 'integer' }
//           },
//           required: ['host', 'port']
//         },
//         fastify: {
//           type: 'object',
//           properties: {
//             logger: {
//               anyOf: [
//                 {
//                   type: 'boolean'
//                 },
//                 {
//                   type: 'object',
//                   properties: {
//                     level: {
//                       type: 'string'
//                     }
//                   },
//                   additionalProperties: true
//                 }
//               ]
//             }
//           }
//         },
//         app: {
//           type: 'object',
//           properties: {
//             uaa: {
//               type: 'object',
//               properties: {
//                 prefix: { type: 'string' }
//               }
//             }
//           }
//         }
//       }
//     }
//   })
//   console.log(`config: ${JSON.stringify(config, null, 2)}`)

//   // console.log(`resolved file: ${resolve('test.config.json')}`)
// }

// test()
