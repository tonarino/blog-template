import * as functions from 'firebase-functions'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { verify, deploy } from '../utilities/slack'

const urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

app.post('/', urlencodedParser, async (request: any, response: any) => {
  const isLegitRequest = verify(request)

  if (!isLegitRequest) {
    return response.send({
      response_type: 'ephemeral',
      text: 'Nope!',
    })
  }

  const { text } = request.body

  switch (text.substr(0, 4).toLowerCase()) {
    case 'stag':
      return deploy(request, response, "staging")
    case 'prod':
      return deploy(request, response, "prod")
    default:
      return response.send({
        response_type: 'in_channel',
        text: 'wut',
      })
  }
})

export const onSlackCommand = functions
  .region('asia-northeast1')
  .https.onRequest(app)
