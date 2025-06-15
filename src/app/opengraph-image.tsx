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
					backgroundColor: '#0a0a0a',
					backgroundImage:
						'radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)',
					backgroundSize: '100px 100px',
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					justifyContent: 'center',
					width: '100%',
				}}
			>
				{/* Dark overlay with subtle gradient */}
				<div
					style={{
						background:
							'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(30, 41, 59, 0.2) 100%)',
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
						textAlign: 'center',
						zIndex: 1,
					}}
				>
					{/* Main Title */}
					<div
						style={{
							background:
								'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
							backgroundClip: 'text',
							color: 'transparent',
							fontSize: 72,
							fontWeight: 'bold',
							marginBottom: '20px',
							textShadow: '0 4px 8px rgba(0,0,0,0.5)',
						}}
					>
						Cœurs Sombres
					</div>

					{/* Subtitle */}
					<div
						style={{
							color: '#d1d5db',
							fontSize: 32,
							fontWeight: '300',
							marginBottom: '30px',
						}}
					>
						Dark Romance #1 sur Wattpad
					</div>

					{/* Author */}
					<div
						style={{
							color: '#9ca3af',
							fontSize: 28,
							fontStyle: 'italic',
							marginBottom: '40px',
						}}
					>
						par Espérance Masson
					</div>

					{/* Stats */}
					<div
						style={{
							alignItems: 'center',
							display: 'flex',
							gap: '40px',
							marginBottom: '30px',
						}}
					>
						<div
							style={{
								alignItems: 'center',
								color: '#14f5d6',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div style={{ fontSize: 32, fontWeight: 'bold' }}>+100k</div>
							<div style={{ color: '#9ca3af', fontSize: 18 }}>Lectures</div>
						</div>
						<div
							style={{
								alignItems: 'center',
								color: '#14f5d6',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div style={{ fontSize: 32, fontWeight: 'bold' }}>#1</div>
							<div style={{ color: '#9ca3af', fontSize: 18 }}>
								Enemies to Lovers
							</div>
						</div>
						<div
							style={{
								alignItems: 'center',
								color: '#14f5d6',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div style={{ fontSize: 32, fontWeight: 'bold' }}>⭐️ 4.9</div>
							<div style={{ color: '#9ca3af', fontSize: 18 }}>Note</div>
						</div>
					</div>

					{/* Tagline */}
					<div
						style={{
							color: '#6b7280',
							fontSize: 20,
							lineHeight: 1.4,
							maxWidth: '800px',
							textAlign: 'center',
						}}
					>
						Entre haine et attirance, Angèle et Lucas Ferrari découvrent
						qu&apos;ils sont liés par des secrets capables de tout détruire...
					</div>
				</div>

				{/* Decorative elements */}
				<div
					style={{
						border: '3px solid #ef4444',
						borderRadius: '50%',
						height: '60px',
						opacity: 0.3,
						position: 'absolute',
						right: '40px',
						top: '40px',
						width: '60px',
					}}
				/>
				<div
					style={{
						border: '2px solid #9333ea',
						borderRadius: '50%',
						bottom: '40px',
						height: '40px',
						left: '40px',
						opacity: 0.3,
						position: 'absolute',
						width: '40px',
					}}
				/>

				{/* Website URL */}
				<div
					style={{
						bottom: '30px',
						color: '#6b7280',
						fontSize: 16,
						position: 'absolute',
						right: '40px',
					}}
				>
					esperance-masson.fr
				</div>
			</div>
		),
		{
			...size,
		}
	)
}
