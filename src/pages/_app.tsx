import '../styles/global.css'
import '../styles/overrides.css'
import 'highlight.js/styles/github.css'
import Router from 'next/router'
import NProgress from 'nprogress'
import blogConfig from 'blog.config'

export {}
declare global {
  interface Window {
    // Make TypeScript happy...
    _paq: any
  }
}

Router.events.on('routeChangeStart', (url) => {
  NProgress.start()
})

Router.events.on('routeChangeComplete', () => {
  NProgress.done()
  let countFunction = (window as any)?.goatcounter?.count;
  if (typeof countFunction === "function") {
    countFunction({
      path: '/blog' + location.pathname + location.search + location.hash,
    })
  }
})
Router.events.on('routeChangeError', () => NProgress.done())

function BlogApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />

      <footer>
        <div>
          <div>
            <span>{blogConfig.footer}</span>
          </div>
        </div>
      </footer>
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `if (window.location.host !== '${blogConfig.baseUrl}') window.goatcounter = {no_onload: true}`,
        }}
      />
      <script
        data-goatcounter={`${blogConfig.goatCounterUrl}/count`}
        async
        src={`${blogConfig.goatCounterUrl}/count.js`}
      ></script>
    </>
  )
}

export default BlogApp
