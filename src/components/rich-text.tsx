import {
  DatePropertyValue,
  RichText,
} from '@notionhq/client/build/src/api-types'
import React from 'react'
import styles from '../styles/rich-text.module.css'
import { ExtLink } from './links'

type DateProps = {
  date: DatePropertyValue
  className?: string
}

export const DateSpan: React.FC<DateProps> = ({ date, className }) => {
  const getDateStr = (dateStr: string): string => {
    const date = new Date(dateStr)

    let options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }
    if (dateStr.includes('T')) {
      options = {
        hour: 'numeric',
        minute: date.getUTCMinutes() !== 0 ? 'numeric' : undefined,
        second: date.getUTCSeconds() !== 0 ? 'numeric' : undefined,
        ...options,
      }
    }
    return date.toLocaleString('en-US', options)
  }

  // TODO(jake): `date as any` is necessary because it seems like Notion's TypeScript exports are wrong here.
  let anydate = date as any
  return (
    <span className={className}>
      {getDateStr(anydate.start)}
      {anydate.end ? ` ⇢ ${getDateStr(anydate.end)}` : ''}
    </span>
  )
}

type RichTextProps = {
  text: RichText[]
}

const RichTextSpan = ({ text }: RichTextProps) => {
  const elements = text.map((element, idx) => {
    switch (element.type) {
      case 'text':
        const { text, annotations } = element
        const content = annotations.code ? (
          <code>{text.content}</code>
        ) : (
          <span>{text.content}</span>
        )
        const Tag = annotations.code ? 'code' : 'span'
        const bgSpanClass = annotations?.color.endsWith('background')
          ? styles.bgspan
          : ''
        return (
          <Tag
            key={idx}
            className={`${
              styles[`color_${annotations?.color}`] || ''
            } ${bgSpanClass}`}
          >
            {text.link ? (
              <ExtLink href={text.link.url}>{content}</ExtLink>
            ) : (
              text.content
            )}
            <style jsx>{`
              span {
                ${annotations?.bold ? 'font-weight: bold;' : ''}
                ${annotations?.italic ? 'font-style: italic;' : ''}
                ${annotations?.strikethrough
                  ? 'text-decoration: line-through;'
                  : ''}
                ${annotations?.underline ? 'text-decoration: underline;' : ''}
              }
            `}</style>
          </Tag>
        )
      case 'mention':
        switch (element.mention.type) {
          case 'user':
            return <span key={idx}>{element.mention.user.name}</span>
          case 'date':
            return (
              <DateSpan
                key={idx}
                date={element.mention.date}
                className={`${styles.bgspan} ${styles.mentioned}`}
              />
            )
          case 'page':
          case 'database':
            return (
              <React.Fragment key={idx}>
                <code>⛔️ Page/database mentions not allowed</code>
                <style jsx>{`
                  code {
                    display: inline-block;
                    border-radius: 6px;
                    background-color: #f55555;
                    padding: 0px 5px;
                  }
                `}</style>
              </React.Fragment>
            )
        }
      default:
        console.warn(`rich text type ${element.type}`)
        return (
          <span key={idx} style={{ color: 'gray' }}>
            (Unsupported rich text)
          </span>
        )
    }
  })
  return <>{elements}</>
}

export default RichTextSpan
