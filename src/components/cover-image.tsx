import React from 'react'
import { getImageFileName } from 'src/lib/image-helpers'
import { BlogEntry } from 'src/lib/notion'


type Props = {
  post: BlogEntry;
}

const CoverImage = ({ post }: Props) => {
  let coverPath = `images/${getImageFileName(post.cover?.file?.url, post.id)}`

  if (!post.cover) {
    return <></>
  } else if (coverPath.endsWith('.mp4')) {
    return (
        <video autoPlay loop muted playsInline src={coverPath}></video>
    )
  } else if (coverPath.endsWith('.gif')) {
    return <img src={coverPath} className="cover" />
  } else {
    return (
      <picture>
        <source srcSet={`${coverPath}.optimized.webp`} type="image/webp" />
        <source srcSet={`${coverPath}.optimized.jpg`} type="image/jpeg" />
        <img src={`${coverPath}.optimized.jpg`} className="cover" />
      </picture>
    )
  }
}

export default CoverImage
