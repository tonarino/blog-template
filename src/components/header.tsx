import Link from 'next/link'
import styles from '../styles/header.module.css'
import blogConfig from 'blog.config'

const Header = ({ language, compact = false }) => {
  return (
    <header className={styles.header}>
      <div className={styles.topContainer}>
        <a href={blogConfig.mainUrl}>
          <img src="/logo.svg" className={styles.tonariLogo} />
        </a>
        {compact && (
          <Link href={language === 'en' ? '/' : '/jp'}>
            <a id="blog">
              <img src="/blog.svg" className={styles.blogLogoCompact} />
            </a>
          </Link>
        )}
        {!compact && (
          <Link href={language === 'en' ? '/jp' : '/'}>
            <a className={`${styles.language} ${styles[language]}`}>
              {language === 'en' ? '日本語' : 'English'}
            </a>
          </Link>
        )}
      </div>
      {!compact && (
        <Link href="/">
          <a id="blog">
            <img src="/blog.svg" className={styles.blogLogo} />
          </a>
        </Link>
      )}
    </header>
  )
}

export default Header
