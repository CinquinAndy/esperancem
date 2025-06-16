import { ImageResponse } from 'next/og'

import { fetchWattpadStats } from '@/lib/wattpad'

// Image metadata
export const alt = 'Cœurs Sombres - Dark Romance par Espérance Masson'
export const size = {
	height: 630,
	width: 1200,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
	// Fetch real Wattpad stats
	const stats = await fetchWattpadStats()

	return new ImageResponse(
		(
			<div
				style={{
					alignItems: 'stretch',
					backgroundColor: '#0a0a0a', // Same background as the site
					display: 'flex',
					height: '100%',
					width: '100%',
				}}
			>
				{/* Column 1: Book Cover (9:16 aspect ratio) */}
				<div
					style={{
						alignItems: 'center',
						display: 'flex',
						flex: '0 0 280px',
						justifyContent: 'center',
						padding: '40px 20px',
					}}
				>
					<div
						style={{
							borderRadius: '12px',
							boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
							height: '400px',
							overflow: 'hidden',
							position: 'relative',
							width: '240px', // 240/400 = 0.6 (close to 9:16)
						}}
					>
						<img
							src='https://esperance-masson.fr/images/photos/cover_on_book.jpg'
							alt='Couverture Cœurs Sombres'
							width='240'
							height='400'
							style={{
								height: '100%',
								objectFit: 'cover',
								width: '100%',
							}}
						/>
						{/* Subtle glow effect */}
						<div
							style={{
								background:
									'linear-gradient(45deg, rgba(239, 68, 68, 0.1) 0%, rgba(147, 51, 234, 0.08) 100%)',
								borderRadius: '12px',
								height: '100%',
								left: '-2px',
								position: 'absolute',
								top: '-2px',
								width: '100%',
								zIndex: -1,
							}}
						/>
					</div>
				</div>

				{/* Columns 2-3: Content */}
				<div
					style={{
						display: 'flex',
						flex: '1',
						flexDirection: 'column',
						justifyContent: 'center',
						padding: '60px 40px 60px 20px',
					}}
				>
					{/* Title */}
					<div
						style={{
							color: '#f4f4f5', // zinc-100
							fontSize: 52,
							fontWeight: 'bold',
							lineHeight: 1.1,
							marginBottom: '12px',
						}}
					>
						Cœurs Sombres
					</div>

					{/* Teal accent line */}
					<div
						style={{
							background: '#14b8a6', // teal-500
							height: '3px',
							marginBottom: '16px',
							width: '100px',
						}}
					/>

					{/* Subtitle */}
					<div
						style={{
							color: '#d4d4d8', // zinc-300
							fontSize: 24,
							fontWeight: '300',
							marginBottom: '12px',
						}}
					>
						Dark Romance #1 sur Wattpad
					</div>

					{/* Author */}
					<div
						style={{
							color: '#a1a1aa', // zinc-400
							fontSize: 20,
							fontStyle: 'italic',
							marginBottom: '32px',
						}}
					>
						par Espérance Masson
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
								backgroundColor: 'rgba(39, 39, 42, 0.4)',
								border: '1px solid #3f3f46',
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
								{stats?.reads || '100k+'}
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 14 }}>Lectures</div>
						</div>

						<div
							style={{
								alignItems: 'center',
								backgroundColor: 'rgba(39, 39, 42, 0.4)',
								border: '1px solid #3f3f46',
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
								backgroundColor: 'rgba(39, 39, 42, 0.4)',
								border: '1px solid #3f3f46',
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
							color: '#71717a', // zinc-500
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
								color: '#14b8a6', // teal-500
								fontSize: 14,
								fontWeight: '500',
							}}
						>
							📖 esperance-masson.fr
						</div>
						<div
							style={{
								color: '#a1a1aa', // zinc-400
								fontSize: 14,
								fontWeight: '400',
							}}
						>
							📚 Gratuit sur Wattpad
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
