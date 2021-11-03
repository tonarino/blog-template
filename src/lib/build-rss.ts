import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import { getBlogIndex } from './notion'
import { Feed } from 'feed'
import blogConfig from '../../blog.config.js'

async function main() {
  const posts = await getBlogIndex()
  const neededAuthors = new Set<string>()

  const blogPosts = posts
    .filter(post => post.language === 'English')
    .map((post) => {
      neededAuthors.add(post.author)
      return post
    })

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
    const link = `${blogConfig.baseUrl}${post.slug}`
    feed.addItem({
      title: post.title,
      description: post.subtitle,
      link,
      id: link,
      date: new Date(post.date?.date?.start),
    })
  })
  const outputPath = './public/index.xml'
  await writeFile(resolve(outputPath), feed.rss2())
  console.log(`RSS feed file generated at \`${outputPath}\``)
}

main().catch((error) => console.error(error))
