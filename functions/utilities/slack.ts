import axios from 'axios'
import * as crypto from 'crypto'
import timeSafeCompare from 'tsscmp'
import * as functions from 'firebase-functions'

const githubToken = functions.config().github.access_token
const githubUsername = functions.config().github.username
const githubRepo = functions.config().github.repository
const slackSigningSecret = functions.config().slack.signing_secret

export const verify = (request: any) => {
  // Grab the signature and timestamp from the headers
  const requestSignature = request.headers['x-slack-signature'] as string
  const requestTimestamp = request.headers['x-slack-request-timestamp']

  const body = request.rawBody
  const data = body.toString()

  // Create the HMAC
  const hmac = crypto.createHmac('sha256', slackSigningSecret)

  // Update it with the Slack Request
  const [version, hash] = requestSignature.split('=')
  const base = `${version}:${requestTimestamp}:${data}`
  hmac.update(base)

  // Returns true if it matches
  return timeSafeCompare(hash, hmac.digest('hex'))
}

export const deploy = async (request: any, response: any, event_type: any) => {
  const http = axios.create({
    baseURL: 'https://api.github.com',
    auth: {
      username: githubUsername,
      password: githubToken,
    },
    headers: {
      // Required https://developer.github.com/v3/repos/#create-a-repository-dispatch-event
      Accept: 'application/vnd.github.everest-preview+json',
    },
  })

  return http
    .post(`/repos/${githubRepo}/dispatches`, { event_type })
    .then(() => {
      return response.send({
        response_type: 'in_channel',
        text: `deployment to ${event_type} started.`,
      })
    })
    .catch((error) => {
      return response.send({
        response_type: 'in_channel',
        text:
          'Something is all jacked up :/ \n ```\n' +
          JSON.stringify(error.toJSON()) +
          '\n```',
      })
    })
}
