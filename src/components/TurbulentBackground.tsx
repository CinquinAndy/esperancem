'use client'

import { useEffect, useRef } from 'react'

export function TurbulentBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const animationRef = useRef<number | null>(null)
	const glRef = useRef<WebGLRenderingContext | null>(null)
	const programRef = useRef<WebGLProgram | null>(null)
	const startTimeRef = useRef<number>(Date.now())
	const uniformsRef = useRef({
		intensityLocation: null as WebGLUniformLocation | null,
		resolutionLocation: null as WebGLUniformLocation | null,
		timeLocation: null as WebGLUniformLocation | null,
		turbAmpLocation: null as WebGLUniformLocation | null,
		turbFreqLocation: null as WebGLUniformLocation | null,
		turbSpeedLocation: null as WebGLUniformLocation | null,
	})

	// Shader configuration adapted for background (subtler than demo)
	const config = {
		intensity: 0.4, // Much subtler for background
		turbAmp: 0.7, // Same as demo
		turbFreq: 2.0, // Same as demo
		turbSpeed: 0.3, // Same as demo
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const init = () => {
			// Initialize WebGL
			const gl =
				(canvas.getContext('webgl') as WebGLRenderingContext | null) ||
				(canvas.getContext(
					'experimental-webgl'
				) as WebGLRenderingContext | null)
			if (!gl) {
				console.warn('WebGL not supported, falling back to static background')
				return
			}

			glRef.current = gl

			const resize = () => {
				canvas.width = window.innerWidth
				canvas.height = window.innerHeight
				gl.viewport(0, 0, canvas.width, canvas.height)
			}

			resize()
			window.addEventListener('resize', resize)

			// Create shaders
			const createShader = (type: number, source: string) => {
				const shader = gl.createShader(type)
				if (!shader) return null

				gl.shaderSource(shader, source)
				gl.compileShader(shader)

				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					console.error('Shader compile error:', gl.getShaderInfoLog(shader))
					gl.deleteShader(shader)
					return null
				}
				return shader
			}

			const vertexShaderSource = `
				attribute vec2 position;
				void main() {
					gl_Position = vec4(position, 0.0, 1.0);
				}
			`

			// Exact copy of the "Turbulent Dark" shader from the HTML demo
			// Original shader by @XorDev - Adapted from Shadertoy
			const fragmentShaderSource = `
				precision highp float;
				
				uniform float u_time;
				uniform vec2 u_resolution;
				uniform float u_turbSpeed;
				uniform float u_turbAmp;
				uniform float u_turbFreq;
				uniform float u_intensity;
				
				// Constants adapted for controls
				#define TURB_NUM 10.0
				#define TURB_EXP 1.4
				
				// Turbulence function adapted from Shadertoy
				vec2 turbulence(vec2 p) {
					float freq = u_turbFreq;
					
					// Rotation matrix for turbulence
					mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
					
					// Loop through turbulence octaves
					for(float i = 0.0; i < TURB_NUM; i++) {
						// Scroll along rotated y coordinate
						float phase = freq * dot(p, rot[1]) + u_turbSpeed * u_time + i;
						
						// Add perpendicular sine wave offset
						p += u_turbAmp * rot[0] * sin(phase) / freq;
						
						// Rotation for next octave
						rot = mat2(
							rot[0][0] * 0.6 - rot[0][1] * (-0.8),
							rot[0][0] * (-0.8) + rot[0][1] * 0.6,
							rot[1][0] * 0.6 - rot[1][1] * (-0.8),
							rot[1][0] * (-0.8) + rot[1][1] * 0.6
						);
						
						// Scale for next octave
						freq *= TURB_EXP;
					}
					
					return p;
				}
				
				void main() {
					// Screen coordinates, centered and aspect-corrected (EXACT COPY)
					vec2 p = 2.0 * (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
					
					// Apply turbulence
					p = turbulence(p);
					
					// Subtle blue and yellow gradient (adapted with intensity control) (EXACT COPY)
					vec3 col = 0.5 * u_intensity * exp(0.1 * p.x * vec3(-1.0, 0.0, 2.0));
					
					// Vary brightness (EXACT COPY)
					float brightness = dot(cos(p * 3.0), sin(-p.yx * 3.0 * 0.618)) + 2.0;
					col /= brightness;
					
					// Exponential tonemap (EXACT COPY)
					col = 1.0 - exp(-col);
					
					gl_FragColor = vec4(col, 1.0);
				}
			`

			const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
			const fragmentShader = createShader(
				gl.FRAGMENT_SHADER,
				fragmentShaderSource
			)

			if (!vertexShader || !fragmentShader) return

			const program = gl.createProgram()
			if (!program) return

			gl.attachShader(program, vertexShader)
			gl.attachShader(program, fragmentShader)
			gl.linkProgram(program)

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error('Program link error:', gl.getProgramInfoLog(program))
				return
			}

			gl.useProgram(program)
			programRef.current = program

			// Get uniform locations
			uniformsRef.current = {
				intensityLocation: gl.getUniformLocation(program, 'u_intensity'),
				resolutionLocation: gl.getUniformLocation(program, 'u_resolution'),
				timeLocation: gl.getUniformLocation(program, 'u_time'),
				turbAmpLocation: gl.getUniformLocation(program, 'u_turbAmp'),
				turbFreqLocation: gl.getUniformLocation(program, 'u_turbFreq'),
				turbSpeedLocation: gl.getUniformLocation(program, 'u_turbSpeed'),
			}

			// Create geometry (fullscreen quad)
			const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

			const buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

			const positionLocation = gl.getAttribLocation(program, 'position')
			gl.enableVertexAttribArray(positionLocation)
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

			// Start animation
			const animate = () => {
				if (!gl || !programRef.current) return

				const currentTime = (Date.now() - startTimeRef.current) / 1000
				const uniforms = uniformsRef.current

				// Update uniforms
				gl.uniform1f(uniforms.timeLocation, currentTime)
				gl.uniform2f(uniforms.resolutionLocation, canvas.width, canvas.height)
				gl.uniform1f(uniforms.turbSpeedLocation, config.turbSpeed)
				gl.uniform1f(uniforms.turbAmpLocation, config.turbAmp)
				gl.uniform1f(uniforms.turbFreqLocation, config.turbFreq)
				gl.uniform1f(uniforms.intensityLocation, config.intensity)

				// Render
				gl.clearColor(0, 0, 0, 1)
				gl.clear(gl.COLOR_BUFFER_BIT)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				animationRef.current = requestAnimationFrame(animate)
			}

			animate()
		}

		init()

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
			}
			window.removeEventListener('resize', () => {})
		}
	}, [config.intensity, config.turbAmp, config.turbFreq, config.turbSpeed])

	return (
		<canvas
			ref={canvasRef}
			data-turbulent-background
			className='fixed inset-0 -z-10 h-full w-full'
			style={{
				filter: 'blur(0.3px) contrast(1.1) brightness(1.2) saturate(1.5)',
				mixBlendMode: 'screen',
				opacity: 0.9,
			}}
		/>
	)
}
