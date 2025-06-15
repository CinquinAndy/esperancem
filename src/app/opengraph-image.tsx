import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Cœurs Sombres - Dark Romance par Espérance Masson'
export const size = {
	height: 630,
	width: 1200,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					alignItems: 'center',
					backgroundColor: '#0a0a0a', // Same background as the site
					// Simulation of turbulent effect with gradients
					backgroundImage: `
						radial-gradient(ellipse at 20% 40%, rgba(0, 70, 67, 0.05) 0%, transparent 50%),
						radial-gradient(ellipse at 80% 60%, rgba(68, 64, 60, 0.05) 0%, transparent 50%),
						radial-gradient(circle at 40% 80%, rgba(39, 39, 42, 0.1) 0%, transparent 50%),
						linear-gradient(135deg, rgba(20, 245, 214, 0.02) 0%, transparent 30%, rgba(39, 39, 42, 0.05) 70%, transparent 100%)
					`,
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					justifyContent: 'center',
					position: 'relative',
					width: '100%',
				}}
			>
				{/* Vignette effect like on the site */}
				<div
					style={{
						background:
							'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.15) 80%)',
						bottom: 0,
						left: 0,
						position: 'absolute',
						right: 0,
						top: 0,
					}}
				/>

				{/* Content */}
				<div
					style={{
						alignItems: 'center',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						padding: '60px',
						position: 'relative',
						textAlign: 'center',
						zIndex: 1,
					}}
				>
					{/* Main Title */}
					<div
						style={{
							color: '#f4f4f5', // zinc-100 from site
							fontSize: 64,
							fontWeight: 'bold',
							lineHeight: 1.1,
							marginBottom: '16px',
							textShadow: '0 4px 8px rgba(0,0,0,0.5)',
						}}
					>
						Cœurs Sombres
					</div>

					{/* Teal accent line */}
					<div
						style={{
							background:
								'linear-gradient(90deg, transparent 0%, #14b8a6 50%, transparent 100%)', // teal-500
							height: '3px',
							marginBottom: '24px',
							width: '120px',
						}}
					/>

					{/* Subtitle */}
					<div
						style={{
							color: '#d4d4d8', // zinc-300
							fontSize: 28,
							fontWeight: '300',
							marginBottom: '32px',
						}}
					>
						Dark Romance #1 sur Wattpad
					</div>

					{/* Author */}
					<div
						style={{
							color: '#a1a1aa', // zinc-400 like on the site
							fontSize: 24,
							fontStyle: 'italic',
							marginBottom: '40px',
						}}
					>
						par Espérance Masson
					</div>

					{/* Stats with site colors */}
					<div
						style={{
							alignItems: 'center',
							display: 'flex',
							gap: '48px',
							marginBottom: '32px',
						}}
					>
						<div
							style={{
								alignItems: 'center',
								backgroundColor: 'rgba(39, 39, 42, 0.3)', // subtle zinc-800
								border: '1px solid #3f3f46', // zinc-700 like site borders
								borderRadius: '12px',
								display: 'flex',
								flexDirection: 'column',
								padding: '16px 24px',
							}}
						>
							<div
								style={{ color: '#14b8a6', fontSize: 28, fontWeight: 'bold' }}
							>
								+100k
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 16 }}>Lectures</div>
						</div>
						<div
							style={{
								alignItems: 'center',
								backgroundColor: 'rgba(39, 39, 42, 0.3)',
								border: '1px solid #3f3f46',
								borderRadius: '12px',
								display: 'flex',
								flexDirection: 'column',
								padding: '16px 24px',
							}}
						>
							<div
								style={{ color: '#14b8a6', fontSize: 28, fontWeight: 'bold' }}
							>
								#1
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 16 }}>
								Enemies to Lovers
							</div>
						</div>
						<div
							style={{
								alignItems: 'center',
								backgroundColor: 'rgba(39, 39, 42, 0.3)',
								border: '1px solid #3f3f46',
								borderRadius: '12px',
								display: 'flex',
								flexDirection: 'column',
								padding: '16px 24px',
							}}
						>
							<div
								style={{ color: '#14b8a6', fontSize: 28, fontWeight: 'bold' }}
							>
								⭐️ 4.9
							</div>
							<div style={{ color: '#a1a1aa', fontSize: 16 }}>Note</div>
						</div>
					</div>

					{/* Tagline */}
					<div
						style={{
							color: '#71717a', // zinc-500 like secondary texts
							fontSize: 18,
							lineHeight: 1.5,
							maxWidth: '800px',
							textAlign: 'center',
						}}
					>
						Entre haine et attirance, Angèle et Lucas Ferrari découvrent
						qu&apos;ils sont liés par des secrets capables de tout détruire...
					</div>
				</div>

				{/* Subtle glow effect like around the book */}
				<div
					style={{
						background:
							'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
						borderRadius: '50%',
						height: '100px',
						position: 'absolute',
						right: '40px',
						top: '30px',
						width: '100px',
					}}
				/>
				<div
					style={{
						background:
							'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
						borderRadius: '50%',
						bottom: '30px',
						height: '80px',
						left: '40px',
						position: 'absolute',
						width: '80px',
					}}
				/>

				{/* Website URL with teal color */}
				<div
					style={{
						bottom: '30px',
						color: '#14b8a6', // teal-500 for URL
						fontSize: 16,
						fontWeight: '500',
						position: 'absolute',
						right: '40px',
					}}
				>
					https://esperance-masson.fr
				</div>
			</div>
		),
		{
			...size,
		}
	)
}
