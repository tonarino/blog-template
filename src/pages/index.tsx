import fs from 'fs';
import Link from 'next/link'
import Header from '../components/header'
import Byline from '../components/byline'
import Head from '../components/head'
import CoverImage from '../components/cover-image'

import blogStyles from '../styles/blog.module.css'
import sharedStyles from '../styles/shared.module.css'

import { BlogEntry, getBlogIndex } from '../lib/notion'
import { fetchImage } from '../lib/image-helpers'

type Props = {
  posts: BlogEntry[];
  lang: "English" | "Japanese";
}

export async function getStaticProps(context) {
  const lang = context.lang || 'en'
  const notionLang = lang === 'en' ? 'English' : 'Japanese'
  const postsTable = await getBlogIndex()

  const posts = (
    await Promise.all(
      postsTable.map(async (post) => {
        // skip unwanted posts
        if (post.language !== notionLang) {
          return null
        }
        if (post.cover?.file?.url) {
          await fetchImage(fs, post.cover.file.url, post.id)
        } else {
          console.warn("cover missing for post:", post)
        }
        return post
      })
    )
  ).filter(Boolean)

  return {
    props: {
      posts,
      lang,
    },
  }
}

const Index = ({ posts = [], lang }: Props) => {
  return (
    <>
      <Head titlePre="Blog" />
      <Header language={lang} />
      <div
        className={`${sharedStyles.layout} ${blogStyles.blogIndex} ${blogStyles.blogContainer}`}
      >
        {posts.length === 0 && (
          <p className={blogStyles.noPosts}>There are no posts yet</p>
        )}
        {posts.map((post) => {
          return (
            <div className={blogStyles.postPreview} key={post.slug}>
              <Link href="/[slug]" passHref as={`/${post.slug}`}>
                <a>
                  <CoverImage post={post} />
                  <div className={blogStyles.title}>{post.title}</div>
                  {post.subtitle && (
                    <div className={blogStyles.subtitle}>{post.subtitle}</div>
                  )}
                </a>
              </Link>
              <Byline post={post} />
            </div>
          )
        })}
      </div>
    </>
  )
}

export default Index
