import { FileWithCaption, ImageBlock, VideoBlock } from '@notionhq/client/build/src/api-types'
import fetch from 'node-fetch'

var sharp = undefined
var ffmpeg = undefined
if (typeof window === 'undefined') {
  sharp = require('sharp')
  ffmpeg = require('fluent-ffmpeg')
}

export function getImageFileName(url: string, id: string): string | null {
  const fileName = url?.split('/')?.pop().split('?')[0];
  return `${id}-${fileName}`
}

export function getMediaBlockFileName(block: ImageBlock | VideoBlock): string | null {
  return getImageFileName(getMediaBlockFile(block)?.file.url, block.id)
}

export function getMediaBlockFile(block: ImageBlock | VideoBlock): FileWithCaption | null {
  if (block.type === "image" && block.image.type === "file") {
    return block.image
  } else if (block.type === "video" && block.video.type === "file") {
    return block.video
  } else {
    return null
  }
}

export async function fetchImage(fs, url: string, id: string): Promise<string> {
  if (!fs.existsSync('public/images')) {
    console.info('created public/images folder.')
    fs.mkdirSync('public/images')
  }

  const fileName = getImageFileName(url, id);
  const filePath = `public/images/${fileName}`
  // Don't download images if they're already there.
  if (!fs.existsSync(filePath)) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`unexpected response ${response.statusText}`)
    }

    const body = await response.buffer()

    // Write the original file.
    fs.writeFileSync(filePath, body)

    // Transcode and optimize if possible
    if (/^.*\.(png|jpe?g)$/.test(fileName)) {
      sharp(body)
        .rotate()
        .resize({
          width: 1500,
          height: 1500,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({
          quality: 80,
        })
        .toFile(`${filePath}.optimized.webp`)
      sharp(body)
        .rotate()
        .resize({
          width: 1500,
          height: 1500,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(`${filePath}.optimized.jpg`)
    } else if (/^.*\.mp4$/.test(fileName)) {
      const thumbnail = await generateThumbnail(filePath, id)
      sharp(thumbnail)
        .rotate()
        .resize({
          width: 1500,
          height: 1500,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(`${filePath}.optimized.jpg`)
    }
  }
  return fileName
}

function generateThumbnail(filePath, id) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on('error', (err) => {
        reject(err)
      })
      .on('end', () => {
        resolve(`/tmp/${id}.png`)
      })
      .screenshots({
        folder: '/tmp',
        filename: `${id}.png`,
        count: 1,
        timemarks: ['25%'],
      })
  })
}
