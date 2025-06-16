import { ImageResponse } from 'next/og'

import { fetchWattpadStats, formatWattpadStat } from '@/lib/wattpad'

// Image metadata
export const alt = "Portrait d'Espérance Masson, autrice de dark romance"
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
					justifyContent: 'center',
					width: '1200px',
				}}
			>
				{/* Column 1: Portrait */}
				<div
					style={{
						alignItems: 'center',
						display: 'flex',
						flex: '0 0 350px',
						justifyContent: 'center',
						padding: '0 50px 0 50px',
					}}
				>
					<div
						style={{
							alignItems: 'center',
							background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
							border: '2px solid #3f3f46',
							borderRadius: '50%',
							boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
							display: 'flex',
							height: '280px',
							justifyContent: 'center',
							overflow: 'hidden',
							position: 'relative',
							width: '280px',
						}}
					>
						<img
							src='https://esperancem.fr/images/'
							alt='Espérance Masson'
						/>
					</div>
				</div>

				{/* Column 2: Content */}
				<div
					style={{
						display: 'flex',
						flex: '0 0 700px',
						flexDirection: 'column',
						justifyContent: 'center',
						padding: '0 50px 0 50px',
					}}
				>
					{/* Title */}
					<div
						style={{
							color: '#f4f4f5',
							fontSize: 48,
							fontWeight: 'bold',
							lineHeight: 1.1,
							marginBottom: '12px',
						}}
					>
						Espérance Masson
					</div>

					{/* Teal accent line */}
					<div
						style={{
							background: '#14b8a6',
							height: '1px',
							marginBottom: '16px',
							width: '80px',
						}}
					/>

					{/* Subtitle */}
					<div
						style={{
							color: '#d4d4d8',
							fontSize: 24,
							fontWeight: '300',
							marginBottom: '24px',
						}}
					>
						Autrice française de dark romance
					</div>

					{/* Description */}
					<div
						style={{
							color: '#a1a1aa',
							fontSize: 18,
							lineHeight: 1.4,
							marginBottom: '32px',
							maxWidth: '600px',
						}}
					>
						Créatrice de &quot;Cœurs Sombres&quot;, j&apos;explore les
						profondeurs de l&apos;âme humaine à travers des histoires intenses
						et captivantes.
					</div>

					{/* Stats */}
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
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 28,
									fontWeight: 'bold',
								}}
							>
								{stats?.reads ? formatWattpadStat(stats.reads) : '85k+'}
							</div>
							<div style={{ color: '#71717a', fontSize: 14 }}>Lectures</div>
						</div>

						<div
							style={{
								alignItems: 'center',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 28,
									fontWeight: 'bold',
								}}
							>
								{stats?.votes || '5k+'}
							</div>
							<div style={{ color: '#71717a', fontSize: 14 }}>J&apos;aime</div>
						</div>

						<div
							style={{
								alignItems: 'center',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div
								style={{
									color: '#14b8a6',
									fontSize: 28,
									fontWeight: 'bold',
								}}
							>
								{stats?.parts || '50+'}
							</div>
							<div style={{ color: '#71717a', fontSize: 14 }}>Chapitres</div>
						</div>
					</div>

					{/* Social Links */}
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
							📷 @esp_masson
						</div>
						<div
							style={{
								color: '#14b8a6',
								fontSize: 14,
								fontWeight: '500',
							}}
						>
							🎵 @_esperance_masson
						</div>
						<div
							style={{
								color: '#14b8a6',
								fontSize: 14,
								fontWeight: '500',
							}}
						>
							📚 Wattpad/Esperancem
						</div>
					</div>
				</div>

				{/* Background subtle effects */}
				<div
					style={{
						background:
							'radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)',
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
