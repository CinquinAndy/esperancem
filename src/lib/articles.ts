import glob from 'glob'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const globPromise = promisify(glob)

export interface Article {
  title: string
  description: string
  date: string
}

export interface ArticleWithSlug extends Article {
  slug: string
}

async function getArticle(
  filePath: string,
): Promise<ArticleWithSlug> {
  let slug = path.basename(path.dirname(filePath))
  let fileContents = await fs.readFile(filePath, 'utf8')
  let { data } = matter(fileContents)

  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
  }
}

export async function getAllArticles(): Promise<ArticleWithSlug[]> {
  let articlePaths = await globPromise(
    'src/app/articles/**/page.mdx',
  )

  let articles = await Promise.all(
    articlePaths.map(getArticle),
  )

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
} 