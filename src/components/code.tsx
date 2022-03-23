import hljs from 'highlight.js'
import { RichText } from '@notionhq/client/build/src/api-types'

type CodeProps = {
  code: RichText[]
  language: string
}

const Code = ({ code, language = 'javascript' }: CodeProps) => {
  language = language.toLowerCase().replace(/\s+/g, '')

  // A hack for Notion not supporting TOML. Map BASIC to it instead...
  if (language === 'basic') language = 'toml'
  let plain_text = code
    .map((element, idx) => {
      switch (element.type) {
        case 'text':
          return element.plain_text
        default:
          console.warn('unexpected rich text item in code block', element)
          return null
      }
    })
    .join('')

  return (
    <>
      <pre>
        <code
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(plain_text, { language }).value,
          }}
        />
      </pre>

      <style jsx>{`
        pre {
          tab-size: 2;
        }

        code {
          overflow: auto;
          display: block;
          padding: 0.8rem;
          line-height: 1.5;
          background: #f5f5f5;
          font-size: 0.75rem;
          border-radius: var(--radius);
        }
      `}</style>
    </>
  )
}

export default Code
