import { ImageResponse } from 'next/og'

import { getContentWithFallback } from '@/lib/content'
import { fetchWattpadStats, formatWattpadStat } from '@/lib/wattpad'

// Image metadata
export const alt = 'Cœurs Sombres - Dark Romance par Espérance Masson'
export const size = {
	height: 630,
	width: 1200,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
	// Fetch real Wattpad stats and content from PocketBase
	const [stats, title, subtitle, author] = await Promise.all([
		fetchWattpadStats(),
		getContentWithFallback('opengraph', 'image', 'title', 'Cœurs Sombres'),
		getContentWithFallback(
			'opengraph',
			'image',
			'subtitle',
			'Dark Romance sur Wattpad'
		),
		getContentWithFallback(
			'opengraph',
			'image',
			'author',
			'par Espérance Masson'
		),
	])

	return new ImageResponse(
		(
			<div
				style={{
					alignItems: 'stretch',
					backgroundColor: '#0a0a0a',
					display: 'flex',
					height: '100%',
					justifyContent: 'center',
					width: '1200px',
				}}
			>
				{/* Column 1: Stylized Book Cover */}
				<div
					style={{
						alignItems: 'center',
						display: 'flex',
						flex: '0 0 300px',
						justifyContent: 'center',
						padding: '0 50px 0 50px',
					}}
				>
					<div
						style={{
							alignItems: 'center',
							background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
							border: '2px solid #3f3f46',
							borderRadius: '12px',
							boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
							display: 'flex',
							flexDirection: 'column',
							height: '400px',
							justifyContent: 'center',
							position: 'relative',
							width: '240px',
						}}
					>
						<img
							src='https://esperancem.fr/cover_on_book.jpg'
							alt='Couverture Cœurs Sombres'
							width='240'
							height='400'
							style={{
								borderRadius: '12px',
							}}
						/>
					</div>
				</div>

				{/* Columns 2-3: Content */}
				<div
					style={{
						display: 'flex',
						flex: '0 0 700px',
						flexDirection: 'column',
						justifyContent: 'center',
						padding: '0 0px 0 100px',
					}}
				>
					{/* Title */}
					<div
						style={{
							color: '#f4f4f5',
							fontSize: 52,
							fontWeight: 'bold',
							lineHeight: 1.1,
							marginBottom: '12px',
						}}
					>
						{title}
					</div>

					{/* Teal accent line */}
					<div
						style={{
							background: '#14b8a6',
							height: '1px',
							marginBottom: '16px',
							width: '100px',
						}}
					/>

					{/* Subtitle */}
					<div
						style={{
							color: '#d4d4d8',
							fontSize: 24,
							fontWeight: '300',
							marginBottom: '12px',
						}}
					>
						{subtitle}
					</div>

					{/* Author */}
					<div
						style={{
							color: '#a1a1aa',
							fontSize: 20,
							fontStyle: 'italic',
							marginBottom: '32px',
						}}
					>
						{author}
					</div>

					{/* Real Stats */}
					<div
						style={{
							display: 'flex',
							gap: '32px',
							marginBottom: '32px',
						}}
					>
						<div
							style={{
								alignItems: 'center',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								padding: '12px 16px',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 24,
									fontWeight: 'bold',
								}}
							>
								{stats?.reads ? formatWattpadStat(stats.reads) : '85k+'}
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 14 }}>Lectures</div>
						</div>

						<div
							style={{
								alignItems: 'center',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								padding: '12px 16px',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 24,
									fontWeight: 'bold',
								}}
							>
								{stats?.votes || '5k+'}
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 14 }}>J&apos;aime</div>
						</div>

						<div
							style={{
								alignItems: 'center',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								padding: '12px 16px',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 24,
									fontWeight: 'bold',
								}}
							>
								{stats?.parts || '50+'}
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 14 }}>Chapitres</div>
						</div>
					</div>

					{/* Description */}
					<div
						style={{
							color: '#71717a',
							fontSize: 16,
							lineHeight: 1.4,
							marginBottom: '24px',
							maxWidth: '600px',
						}}
					>
						Entre haine et attirance, Angèle et Lucas Ferrari découvrent
						qu&apos;ils sont liés par des secrets capables de tout détruire...
					</div>

					{/* Links */}
					<div
						style={{
							alignItems: 'center',
							display: 'flex',
							gap: '24px',
						}}
					>
						<div
							style={{
								alignItems: 'center',
								display: 'flex',
								gap: '8px',
							}}
						>
							<svg width='16' height='16' viewBox='0 0 448 512' fill='#14b8a6'>
								<path d='M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9 26.3 26.2 58 34.4 93.9 36.2 37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z' />
							</svg>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 14,
									fontWeight: '500',
								}}
							>
								@esp_masson
							</div>
						</div>
						<div
							style={{
								alignItems: 'center',
								display: 'flex',
								gap: '8px',
							}}
						>
							<svg
								width='16'
								height='16'
								viewBox='1.486 -28.277 62.569 102.964'
								fill='#14b8a6'
							>
								<path d='m16.778 18.728s.948-7.542 0-10.964-3.174-5.193-6.471-5.4-8 2.885-8.821 11.294a76.488 76.488 0 0 0 .206 19.207c.7 4.163 2.721 10.1 6.224 12.448s7.832 2.432 11.005-.329 8.821-16.611 11.047-19.662c0 0-.783 10.14 3.545 13.644s10.3 2.638 12.9-2.061 8.573-16.941 11.994-21.928 5.648-8.243 4.082-10.877-6.389-2.349-9.521.577-10.717 11.001-10.717 11.001 1.566-12.278-3.339-14.096-10.428 0-15.663 7.666z' />
							</svg>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 14,
									fontWeight: '500',
								}}
							>
								Wattpad/Esperancem
							</div>
						</div>
					</div>
				</div>

				{/* Background subtle effects */}
				<div
					style={{
						background:
							'radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.03) 0%, transparent 50%)',
						height: '100%',
						left: 0,
						position: 'absolute',
						top: 0,
						width: '100%',
						zIndex: -1,
					}}
				/>
			</div>
		),
		{
			...size,
		}
	)
}
