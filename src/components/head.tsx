import Head from 'next/head'
import blogConfig from 'blog.config'

const BlogHead = ({
  titlePre = '',
  description = '',
  path = '/',
  ogImage = blogConfig.ogImage,
}) => {
  return (
    <Head>
      <title>
        {titlePre ? `${titlePre} |` : ''} {blogConfig.title}
      </title>
      <meta property="og:description" content={description} />
      <meta
        property="og:title"
        content={`${titlePre ? `${titlePre} |` : ''} ${blogConfig.title}`}
      />
      <meta property="og:url" content={`${blogConfig.baseUrl}${path}`} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="twitter:site" content={blogConfig.ogTwitter} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:image" content={ogImage} />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="stylesheet" type="text/css" href="/nprogress.css" />
      <link rel="stylesheet" type="text/css" href="/katex.min-v0.15.3.css" />
      <link
        rel="preload"
        href="/fonts/ibm-plex-serif-v8-latin-regular.woff2"
        as="font"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/ibm-plex-mono-v5-latin-regular.woff2"
        as="font"
        crossOrigin="anonymous"
      />
      <link
        rel="alternate"
        type="application/rss+xml"
        href={`${blogConfig.baseUrl}/index.xml`}
        title={blogConfig.title}
      />
    </Head>
  )
}

export default BlogHead
