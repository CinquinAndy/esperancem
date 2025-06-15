import { type Metadata } from 'next'
import Image from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import logoAnimaginary from '@/images/logos/animaginary.svg'
import logoCosmos from '@/images/logos/cosmos.svg'
import logoOpenShuttle from '@/images/logos/open-shuttle.svg'
import logoPlanetaria from '@/images/logos/planetaria.svg'

function LinkIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
			<path
				d='M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.122-4.243a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm-4.243 2.122a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm2.122 4.243a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm2.121-2.121a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm-2.12-2.122a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm-6.364-3.182a.75.75 0 1 0 0-1.5v1.5Zm0 1.5a.75.75 0 1 0 0 1.5v-1.5Zm11.668-3.182a.75.75 0 1 0 0-1.5v1.5Zm0 1.5a.75.75 0 1 0 0 1.5v-1.5ZM4.432 12a.75.75 0 1 0 0-1.5v1.5Zm0 1.5a.75.75 0 1 0 0 1.5v-1.5Zm11.668-3.182a.75.75 0 1 0 0-1.5v1.5Zm0 1.5a.75.75 0 1 0 0 1.5v-1.5Z'
				fill='currentColor'
			/>
		</svg>
	)
}

const projects = [
	{
		description:
			'Creating technology to empower civilians to explore space on their own terms.',
		link: { href: 'https://planetaria.tech', label: 'planetaria.tech' },
		logo: logoPlanetaria,
		name: 'Planetaria',
	},
	{
		description:
			'High-performance reactive UI library for building intricate user interfaces.',
		link: { href: '#', label: 'github.com' },
		logo: logoAnimaginary,
		name: 'Animaginary',
	},
	{
		description:
			'A UI toolkit for building global applications with a focus on accessibility.',
		link: { href: '#', label: 'github.com' },
		logo: logoOpenShuttle,
		name: 'OpenShuttle',
	},
	{
		description:
			'A cloud platform for scaling AI-powered applications with high-throughput.',
		link: { href: '#', label: 'github.com' },
		logo: logoCosmos,
		name: 'Cosmos',
	},
	{
		description:
			'The missing civilian space shuttle. An open-source project to democratize space travel.',
		link: { href: '#', label: 'github.com' },
		logo: logoOpenShuttle,
		name: 'OpenShuttle',
	},
]

export const metadata: Metadata = {
	description: "Things I've made trying to put my dent in the universe.",
	title: 'Projects',
}

export default function Projects() {
	return (
		<SimpleLayout
			title="Things I've made trying to put my dent in the universe."
			intro="I've worked on tons of little projects over the years but these are the ones that I'm most proud of. Many of them are open-source, so if you see something that piques your interest, check out the code and contribute if you have ideas for how it can be improved."
		>
			<ul
				role='list'
				className='grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3'
			>
				{projects.map(project => (
					<Card as='li' key={project.name}>
						<div className='relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800 shadow-md ring-0 ring-1 shadow-zinc-800/5'>
							<Image
								src={project.logo}
								alt=''
								className='h-8 w-8'
								unoptimized
							/>
						</div>
						<h2 className='mt-6 text-base font-semibold text-zinc-100'>
							<Card.Link href={project.link.href}>{project.name}</Card.Link>
						</h2>
						<Card.Description>{project.description}</Card.Description>
						<p className='relative z-10 mt-6 flex text-sm font-medium text-zinc-200 transition group-hover:text-teal-500'>
							<LinkIcon className='h-6 w-6 flex-none' />
							<span className='ml-2'>{project.link.label}</span>
						</p>
					</Card>
				))}
			</ul>
		</SimpleLayout>
	)
}
