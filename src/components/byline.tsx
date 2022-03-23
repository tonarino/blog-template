import React, { useState } from 'react'
import Slugger from 'github-slugger'
import styles from '../styles/byline.module.css'
import { BlogEntry } from 'src/lib/notion'
import { DateSpan } from './rich-text'
import blogConfig from '../../blog.config'

type Props = {
  post: BlogEntry
}

const Byline = ({ post }: Props) => {
  var author = new Slugger().slug(post.author)

  return (
    <div className={styles.byline} style={{ display: 'flex' }}>
      {!post.published && (
        <div>
          <span className={styles.draftBadge}>UNPUBLISHED</span>
        </div>
      )}
      <div className={styles.profileimage}>
        {post.author && (
          <img src={`/profiles/${author}.jpg`} width="48" height="48" />
        )}
      </div>
      <div className={styles.bylinetext}>
        {post.author && (
          <div
            className={styles.authors}
            style={{ color: blogConfig.authorColors[author] }}
          >
            {post.author}
          </div>
        )}
        {post.date && (
          <div className={styles.posted}>
            <DateSpan date={post.date} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Byline
