import Index, { getStaticProps as indexGetStaticProps } from './index'

export async function getStaticProps(context) {
  return indexGetStaticProps({
    lang: 'jp',
    ...context
  })
}

export default Index;
