import fs from 'fs/promises'
import { glob } from 'glob'
import matter from 'gray-matter'
import path from 'path'

export interface Article {
	title: string
	description: string
	date: string
}

export interface ArticleWithSlug extends Article {
	slug: string
}

async function getArticle(filePath: string): Promise<ArticleWithSlug> {
	const slug = path.basename(path.dirname(filePath))
	const fileContents = await fs.readFile(filePath, 'utf8')
	const { data } = matter(fileContents)

	return {
		date: data.date,
		description: data.description,
		slug,
		title: data.title,
	}
}

export async function getAllArticles(): Promise<ArticleWithSlug[]> {
	const articlePaths = await glob('src/app/articles/**/page.mdx')

	const articles = await Promise.all(articlePaths.map(getArticle))

	return articles.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	)
}
