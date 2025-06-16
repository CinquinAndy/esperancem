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
					background: 'linear-gradient(145deg, #0a0a0a, #1a1a1a)',
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
						padding: '0 50px 0 50px',
						justifyContent: 'center',
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
						padding: '0 0px 0 100px',
						justifyContent: 'center',
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
						Cœurs Sombres
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
						Dark Romance à succès sur Wattpad
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
								color: '#14b8a6',
								fontSize: 14,
								fontWeight: '500',
							}}
						>
							📖 https://esperancem.fr
						</div>
						<div
							style={{
								color: '#14b8a6',
								fontSize: 14,
								fontWeight: '500',
							}}
						>
							📚 https://www.wattpad.com/user/Esperancem
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
