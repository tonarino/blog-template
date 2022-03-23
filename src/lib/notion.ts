import { resolve } from 'path'
import { Client } from '@notionhq/client'
import {
  Block,
  CheckboxPropertyValue,
  DatePropertyValue,
  File,
  FilesPropertyValue,
  Page,
  PeoplePropertyValue,
  RichTextPropertyValue,
  SelectPropertyValue,
  TitlePropertyValue,
} from '@notionhq/client/build/src/api-types'
import { readFile, writeFile } from 'fs/promises'
import blogConfig from '../../blog.config'

export type NamedFile = File & { id: string; name: string }

export type BlogEntry = {
  id: string
  slug: string
  author: string | null
  cover: NamedFile
  date: DatePropertyValue
  published: boolean
  title: string
  subtitle: string | null
  language: 'English' | 'Japanese'
}

export type BlogContent = {
  blocks: Block[]
}

export type BlogPost = BlogContent & BlogEntry

type BlogDatabaseEntry = {
  id: string
  properties: {
    Page: TitlePropertyValue
    Authors: PeoplePropertyValue
    Slug: RichTextPropertyValue
    Cover: FilesPropertyValue
    Date: DatePropertyValue
    Published: CheckboxPropertyValue
    Subtitle: RichTextPropertyValue
    Language: SelectPropertyValue
  }
}

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const isProduction = (): boolean => process.env.APP_ENV === 'prod'
const BLOG_INDEX_CACHE = resolve('.blog_index_data')

export async function getBlogIndex(): Promise<BlogEntry[]> {
  let postsTable = null

  const useCache = process.env.USE_CACHE !== 'false'
  if (useCache) {
    try {
      postsTable = JSON.parse(await readFile(BLOG_INDEX_CACHE, 'utf8'))
    } catch (e) {
      /* not fatal */
    }
  }

  if (!postsTable) {
    const pages: BlogDatabaseEntry[] = []
    let cursor = undefined
    do {
      const { results, next_cursor } = await notion.databases.query({
        database_id: blogConfig.databaseId,
        start_cursor: cursor,
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
        filter: isProduction()
          ? {
              property: 'Published',
              checkbox: {
                equals: true,
              },
            }
          : undefined,
      })
      // Cheaply add stronger typing to the database entry properties.
      // TODO(jake): maybe add more typechecking for better error messaging later.
      pages.push(...(results as any[] as BlogDatabaseEntry[]))
      cursor = next_cursor
    } while (cursor)
    let blogEntries = pages.map((page: BlogDatabaseEntry) => {
      const title = page.properties.Page.title[0].plain_text
      const authorObj = page.properties.Authors.people?.at(0)
      const author =
        authorObj?.name || blogConfig.authorNameOverrides[authorObj.id]
      if (!authorObj) {
        console.warn(`Blog "${title}" is missing an author.`)
      } else if (!author) {
        console.warn(
          `Blog "${title}" has an author with no name and no overridden name in the config (user id: ${authorObj.id}).`
        )
      }
      return {
        id: page.id,
        slug: page.properties.Slug.rich_text[0].plain_text,
        author,
        cover: page.properties.Cover.files[0],
        date: page.properties.Date.date,
        published: page.properties.Published.checkbox,
        title,
        subtitle: page.properties.Subtitle.rich_text[0]?.plain_text || null,
        language: page.properties.Language.select.name,
      }
    })

    postsTable = blogEntries
    if (useCache) {
      await writeFile(
        BLOG_INDEX_CACHE,
        JSON.stringify(postsTable),
        'utf8'
      ).catch(() => {})
    }
  }

  return postsTable
}

async function getChildren(block_id: string): Promise<Block[]> {
  const blocks: Block[] = []
  let cursor = undefined
  do {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id,
      start_cursor: cursor,
      page_size: 100,
    })
    blocks.push(...results)
    cursor = next_cursor
  } while (cursor)

  return await Promise.all(
    blocks.map(async (block) => {
      if (block.has_children) {
        return {
          children: await getChildren(block.id),
          ...block,
        }
      } else {
        return block
      }
    })
  )
}

export async function getPageData(entry: BlogEntry): Promise<BlogPost> {
  try {
    return { blocks: await getChildren(entry.id), ...entry }
  } catch (err) {
    throw new Error(
      `Failed to load pageData for ${entry.slug} (${entry.id}): ${err}`
    )
  }
}
