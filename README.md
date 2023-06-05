# @itross/c11n

<p>A na&iuml;f Node.js app configuration from file, envirnoment variables and remote secrets manager with JSON schema verification and type coercion.</p>

## Install

```bash
npm i @itross/c11n
```

## Usage

TODO

## Tests
__NOTE__: *c11n.config.json* is just a sample config file for tests.

To correctly test AWS Secrets Manager client, you must have env vars:
* AWS_REGION=us-east-1
* AWS_ACCESS_KEY_ID=
* AWS_SECRET_ACCESS_KEY=

You can put them in a .env file. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY can be null, but you need your AWS credentials file in your environment.
## API

TODO

## License

[MIT](LICENSE)
