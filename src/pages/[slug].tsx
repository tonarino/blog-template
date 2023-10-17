import fs from 'fs'
import { useRouter } from 'next/router'
import CoverImage from '../components/cover-image'
import Head from '../components/head'
import Header from '../components/header'
import Byline from '../components/byline'
import blogStyles from '../styles/blog.module.css'
import { BlogPost, getBlogIndex, getPageData } from '../lib/notion'
import React, { CSSProperties, useEffect } from 'react'
import {
  fetchImage,
  getImageFileName,
  getMediaBlockFile,
  getMediaBlockFileName,
} from '../lib/image-helpers'
import {
  FileWithCaption,
  ImageBlock,
  VideoBlock,
} from '@notionhq/client/build/src/api-types'
import RichTextSpan from 'src/components/rich-text'
import Code from 'src/components/code'
import blogConfig from 'blog.config'
import katex from 'katex'

type Props = {
  post: BlogPost
  redirect: any
}

// Enumerates all paths that will be expanded to their own static page.
export async function getStaticPaths() {
  const paths = (await getBlogIndex()).map((blog) => ({
    params: { slug: blog.slug },
  }))
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params: { slug } }) {
  const postsTable = await getBlogIndex()
  const entry = postsTable.find((post) => post.slug === slug)

  if (!entry) {
    console.log(`Failed to find post for slug: ${slug}`)
    return {
      props: {
        redirect: '/',
        preview: false,
      },
    }
  }

  let imagePromises = []
  if (entry.cover) {
    imagePromises.push(fetchImage(fs, entry.cover.file.url, entry.id))
  }

  const post = await getPageData(entry)

  const getChildren = (block) => {
    if (block.children) {
      return block.children
        .map((child) => [child, ...getChildren(child)])
        .flat(Infinity)
    } else {
      return [block]
    }
  }
  const blocks = post.blocks.map((block) => getChildren(block)).flat()
  for (const block of blocks) {
    const { type, id } = block

    let url = null
    if (type === 'image' || type === 'video') {
      const file = (block as ImageBlock).image || (block as VideoBlock).video
      if (file.type === 'file') {
        url = (file as FileWithCaption).file.url
      }
    }
    if (url) {
      imagePromises.push(fetchImage(fs, url, id))
    }
  }

  await Promise.all(imagePromises)

  return {
    props: {
      post,
    },
  }
}

type OlTypes = '1' | 'a' | 'i'
function getElements(blocks, level = 0): JSX.Element[] {
  let elements = []
  let numberedLevels: OlTypes[] = ['1', 'a', 'i']
  let numberedListItems = []
  let bulletedListItems = []
  for (const block of blocks) {
    const children =
      block.type !== 'column_list' && block.children?.length > 0
        ? getElements(block.children, level + 1)
        : []
    if (block.type !== 'numbered_list_item' && numberedListItems.length > 0) {
      elements.push(
        <ol key={numberedListItems[0].key} type={numberedLevels[level] || '1'}>
          {numberedListItems}
        </ol>
      )
      numberedListItems = []
    }
    if (block.type !== 'bulleted_list_item' && bulletedListItems.length > 0) {
      elements.push(<ul key={bulletedListItems[0].key}>{bulletedListItems}</ul>)
      bulletedListItems = []
    }

    switch (block.type) {
      case 'paragraph':
        elements.push(
          <p key={block.id}>
            <RichTextSpan text={block.paragraph.text} />
            {children}
          </p>
        )
        break
      case 'code':
        elements.push(
          <Code
            key={block.id}
            code={block.code.text}
            language={block.code.language}
          />
        )
        break
      case 'callout':
        elements.push(
          <div key={block.id} className="callout">
            {block.callout.icon?.type === 'emoji' && (
              <div>{block.callout.icon.emoji}</div>
            )}
            <div className="text">
              <RichTextSpan text={block.callout.text} />
            </div>
          </div>
        )
        break
      case 'quote':
        elements.push(
          <blockquote key={block.id}>
            <RichTextSpan text={block.quote.text} />
          </blockquote>
        )
        break
      case 'image':
      case 'video': {
        let child = null
        const mediaBlock = getMediaBlockFile(block)
        const imagePath = getMediaBlockFileName(block)
        const last_caption_text = mediaBlock.caption
          ? mediaBlock.caption[mediaBlock.caption.length - 1]?.plain_text
          : null
        const widthOverride = last_caption_text?.match(
          /\d+(%|px|vw|vh|vmin|vmax)/g
        )
          ? last_caption_text
          : null

        if (block.type === 'image' && imagePath) {
          var image = null
          var webpImage = null
          if (/^.*\.(png|jpe?g)$/.test(imagePath)) {
            image = `images/${imagePath}.optimized.jpg`
            webpImage = `images/${imagePath}.optimized.webp`
          }

          child = (
            <picture>
              {webpImage && <source srcSet={webpImage} type="image/webp" />}
              <source srcSet={image} />
              <img src={image} className={blogStyles.postMedia} />
            </picture>
          )
        } else if (block.type === 'video' && imagePath) {
          child = (
            <video
              src={`images/${imagePath}`}
              loop={true}
              muted={true}
              autoPlay={true}
              playsInline={true}
            />
          )
        } else {
          console.warn(
            `failed to work out media for block of type ${block.type}`
          )
          child = <div style={{ color: 'red' }}>Media type missing.</div>
        }

        const figure = (
          <React.Fragment key={block.id}>
            <figure>
              {child}
              {mediaBlock?.caption ? (
                <figcaption>
                  <RichTextSpan
                    text={mediaBlock.caption.slice(
                      0,
                      (widthOverride && -1) || undefined
                    )}
                  />
                </figcaption>
              ) : (
                ''
              )}
            </figure>
            <style jsx>{`
              figure {
                max-width: 100%;
                width: ${widthOverride || '100%'};
              }
              figure > :global(img),
              :global(video) {
                display: block;
                width: 100%;
                border: none;
              }
            `}</style>
          </React.Fragment>
        )

        elements.push(figure)
        break
      }
      case 'heading_1':
        elements.push(
          <h1 key={block.id}>
            <RichTextSpan text={block.heading_1.text} />
          </h1>
        )
        break
      case 'heading_2':
        elements.push(
          <h2 key={block.id}>
            <RichTextSpan text={block.heading_2.text} />
          </h2>
        )
        break
      case 'heading_3':
        elements.push(
          <h3 key={block.id}>
            <RichTextSpan text={block.heading_3.text} />
          </h3>
        )
        break
      case 'bulleted_list_item':
        bulletedListItems.push(
          <li key={block.id}>
            <RichTextSpan text={block.bulleted_list_item.text} />
            {children}
          </li>
        )
        break
      case 'numbered_list_item':
        numberedListItems.push(
          <li key={block.id}>
            <RichTextSpan text={block.numbered_list_item.text} />
            {children}
          </li>
        )
        break
      case 'to_do':
        elements.push(
          <React.Fragment key={block.id}>
            <div>
              <input type="checkbox" checked={block.to_do.checked} readOnly />
              <RichTextSpan text={block.to_do.text} />
            </div>
            {children}
            <style jsx>{`
              input[type='checkbox'][disabled] {
                pointer-events: none;
              }
            `}</style>
          </React.Fragment>
        )
        break
      case 'divider':
        elements.push(<hr key={block.id} />)
        break
      case 'column_list':
        elements.push(
          <div key={block.id} className={blogStyles.columnContainer}>
            {block.children.map((column) => (
              <div className={blogStyles.column}>
                {getElements(column.children)}
              </div>
            ))}
          </div>
        )
        break
      case 'equation':
        elements.push(
          <div key={block.id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(block.equation.expression, {
                throwOnError: false
              })
            }}
          />
        )
        break
      case 'column':
        throw new Error(
          `'column' type found in elements list, which should not happen.`
        )
      default:
        elements.push(
          <div key={block.id} style={{ color: 'red', fontWeight: 'bold' }}>
            <i>️⛔️ Unrendered block (type: {block.type})</i>
          </div>
        )
        console.log(block)
        break
    }
  }
  if (numberedListItems.length > 0) {
    elements.push(
      <ol key={numberedListItems[0].key} type={numberedLevels[level] || '1'}>
        {numberedListItems}
      </ol>
    )
  }
  if (bulletedListItems.length > 0) {
    elements.push(<ul key={bulletedListItems[0].key}>{bulletedListItems}</ul>)
  }
  return elements
}

const Slug = ({ post, redirect }: Props) => {
  const router = useRouter()

  useEffect(() => {
    if (redirect && !post) {
      router.replace(redirect)
    }
  }, [redirect, post])

  // Add metrics for page.
  useEffect(() => {
    var time_since_load = Date.now()
    var time_since_focus =
      document.visibilityState === 'visible' ? Date.now() : 0
    var time_focused_ms = 0
    var scrolled_90 = false

    function countEvent(slug, title) {
      if (
        !sent[slug] &&
        window.location.href.startsWith(blogConfig.baseUrl) &&
        typeof (window as any)?.goatcounter?.count === 'function'
      ) {
        ;(window as any)?.goatcounter?.count({
          path: `/blog${window.location.pathname}${window.location.search}/${slug}`,
          title: `${title}: ${document.title}`,
          event: true,
        })
        sent[slug] = true
      }
    }
    var sent = {}

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        time_since_focus = Date.now()
      } else {
        if (time_since_focus > 0) {
          time_focused_ms += +Date.now() - time_since_focus
        }
        time_since_focus = 0
      }
    })

    function _listenFor10Scroll() {
      var h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight'

      var percent =
        ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100

      if (percent > 10.0) {
        document.removeEventListener('scroll', _listenFor10Scroll)
        countEvent('started-scroll', 'Scrolled 10% of page')
      }
    }

    function _listenFor90Scroll() {
      var h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight'

      var percent =
        ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100

      if (percent > 90.0) {
        scrolled_90 = true
        document.removeEventListener('scroll', _listenFor90Scroll)
        countEvent('finished-scroll', 'Scrolled 90% of the page')
      }
    }

    document.addEventListener('scroll', _listenFor90Scroll)
    document.addEventListener('scroll', _listenFor10Scroll)

    let interval = setInterval(() => {
      let minute_marker = null
      let now = Date.now()
      if (!sent['2-minute'] && now - time_since_load > 120000) {
        minute_marker = '2-minute'
      }
      if (!sent['5-minute'] && now - time_since_load > 300000) {
        minute_marker = '5-minute'
      }
      if (!sent['10-minute'] && now - time_since_load > 600000) {
        minute_marker = '10-minute'
      }

      if (minute_marker != null) {
        countEvent(minute_marker, `Stayed on page (${minute_marker})`)
      }

      if (sent['5-minute'] && scrolled_90) {
        countEvent('completed-read', 'Completed read')
      }
    }, 1000)

    return function cleanup() {
      document.removeEventListener('scroll', _listenFor10Scroll)
      document.removeEventListener('scroll', _listenFor90Scroll)
      clearInterval(interval)
    }
  }, [])

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  // if you don't have a post at this point, and are not
  // loading one from fallback then redirect back to the index
  if (!post) {
    return (
      <div className={blogStyles.post}>
        <p>
          Woops! didn't find that post, redirecting you back to the blog index
        </p>
      </div>
    )
  }

  let elements = getElements(post.blocks)

  return (
    <>
      <Head
        titlePre={post.title}
        description={post.subtitle}
        path={router.asPath}
        ogImage={`${blogConfig.baseUrl}/images/${getImageFileName(
          post.cover.file.url,
          post.id
        )}.optimized.jpg`}
      />
      <Header compact language={post.language === 'English' ? 'en' : 'jp'} />
      <div className={blogStyles.blogContainer}>
        <div className={`${blogStyles.post} ${post.language}`}>
          <CoverImage post={post} />
          <div className={blogStyles.title}>{post.title || ''}</div>
          {post.subtitle && (
            <div className={blogStyles.subtitle}>{post.subtitle}</div>
          )}
          <Byline post={post} />

          <div className={blogStyles.postContent}>
            {elements.length === 0 && <p>This post has no content</p>}
            {elements}
          </div>
        </div>
      </div>
    </>
  )
}

export default Slug
