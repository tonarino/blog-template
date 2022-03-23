const fs = require('fs')
const path = require('path')

module.exports = (phase, { defaultConfig }) => {
  try {
    fs.unlinkSync(path.resolve('.blog_index_data'))
  } catch (_) {}

  if (!process.env.NOTION_API_KEY) {
    throw new Error('\nNOTION_API_KEY is missing from env and is required!')
  }

  return defaultConfig
}
