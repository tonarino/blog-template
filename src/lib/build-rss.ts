import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import { getBlogIndex } from './notion'
import { Feed } from 'feed'
import blogConfig from '../../blog.config.js'

async function main() {
  const postsTable = await getBlogIndex()
  const neededAuthors = new Set<string>()

  const blogPosts = Object.keys(postsTable)
    .map((slug) => {
      const post = postsTable[slug]
      if (post.Language !== 'English') return

      post.authors = post.Authors || []

      for (const author of post.authors) {
        neededAuthors.add(author)
      }
      return post
    })
    .filter(Boolean)

  const feed = new Feed({
    title: blogConfig.title,
    id: blogConfig.baseUrl,
    link: blogConfig.baseUrl,
    language: 'en',
    image: `${blogConfig.baseUrl}/favicon-32x32.png`,
    favicon: `${blogConfig.baseUrl}/favicon-32x32.png`,
    copyright: blogConfig.footer,
    generator: 'totoro',
  })

  blogPosts.forEach((post) => {
    const link = `${blogConfig.baseUrl}${post.Slug}`
    feed.addItem({
      title: post.Page,
      description: post.Subtitle,
      link,
      id: link,
      date: new Date(post.Date),
    })
  })
  const outputPath = './public/index.xml'
  await writeFile(resolve(outputPath), feed.rss2())
  console.log(`RSS feed file generated at \`${outputPath}\``)
}

main().catch((error) => console.error(error))
