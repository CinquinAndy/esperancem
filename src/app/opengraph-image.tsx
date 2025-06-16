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
					backgroundColor: '#0a0a0a',
					display: 'flex',
					height: '100%',
					width: '100%',
				}}
			>
				{/* Column 1: Stylized Book Cover */}
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
						{/* Book cover design */}
						<div
							style={{
								color: '#f4f4f5',
								fontSize: 24,
								fontWeight: 'bold',
								marginBottom: '12px',
								textAlign: 'center',
							}}
						>
							CŒURS
						</div>
						<div
							style={{
								background: '#14b8a6',
								height: '2px',
								marginBottom: '12px',
								width: '60px',
							}}
						/>
						<div
							style={{
								color: '#f4f4f5',
								fontSize: 24,
								fontWeight: 'bold',
								marginBottom: '24px',
								textAlign: 'center',
							}}
						>
							SOMBRES
						</div>
						<div
							style={{
								background: 'linear-gradient(45deg, #ef4444, #8b5cf6)',
								borderRadius: '50%',
								height: '80px',
								opacity: 0.3,
								width: '80px',
							}}
						/>
						<div
							style={{
								color: '#a1a1aa',
								fontSize: 14,
								fontStyle: 'italic',
								marginTop: '24px',
								textAlign: 'center',
							}}
						>
							Espérance Masson
						</div>

						{/* Glow effect */}
						<div
							style={{
								background:
									'linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(147, 51, 234, 0.1))',
								borderRadius: '12px',
								height: '100%',
								left: '-2px',
								position: 'absolute',
								top: '-2px',
								width: '100%',
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
							height: '3px',
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
						Dark Romance #3 sur Wattpad
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
							📖 esperance-masson.fr
						</div>
						<div
							style={{
								color: '#a1a1aa',
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
