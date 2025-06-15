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

	// Shader configuration (more subtle for background)
	const config = {
		intensity: 0.6, // Softer
		turbAmp: 0.4, // More subtle
		turbFreq: 1.5, // Less intense
		turbSpeed: 0.15, // Slower
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

			// Shader adapted from Shadertoy with background optimizations
			const fragmentShaderSource = `
				precision highp float;
				
				uniform float u_time;
				uniform vec2 u_resolution;
				uniform float u_turbSpeed;
				uniform float u_turbAmp;
				uniform float u_turbFreq;
				uniform float u_intensity;
				
				#define TURB_NUM 8.0
				#define TURB_EXP 1.3
				
				vec2 turbulence(vec2 p) {
					float freq = u_turbFreq;
					mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
					
					for(float i = 0.0; i < TURB_NUM; i++) {
						float phase = freq * dot(p, rot[1]) + u_turbSpeed * u_time + i;
						p += u_turbAmp * rot[0] * sin(phase) / freq;
						
						rot = mat2(
							rot[0][0] * 0.6 - rot[0][1] * (-0.8),
							rot[0][0] * (-0.8) + rot[0][1] * 0.6,
							rot[1][0] * 0.6 - rot[1][1] * (-0.8),
							rot[1][0] * (-0.8) + rot[1][1] * 0.6
						);
						
						freq *= TURB_EXP;
					}
					
					return p;
				}
				
				void main() {
					vec2 p = 2.0 * (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
					p = turbulence(p);
					
					// Darker and subtler colors for background
					vec3 col = 0.3 * u_intensity * exp(0.08 * p.x * vec3(-0.5, 0.2, 1.2));
					
					float brightness = dot(cos(p * 2.5), sin(-p.yx * 2.5 * 0.618)) + 2.5;
					col /= brightness;
					
					col = 1.0 - exp(-col * 0.8);
					
					// Darken even more to be a true background
					col *= 0.4;
					
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

			// Obtenir les emplacements des uniforms
			uniformsRef.current = {
				intensityLocation: gl.getUniformLocation(program, 'u_intensity'),
				resolutionLocation: gl.getUniformLocation(program, 'u_resolution'),
				timeLocation: gl.getUniformLocation(program, 'u_time'),
				turbAmpLocation: gl.getUniformLocation(program, 'u_turbAmp'),
				turbFreqLocation: gl.getUniformLocation(program, 'u_turbFreq'),
				turbSpeedLocation: gl.getUniformLocation(program, 'u_turbSpeed'),
			}

			// Créer la géométrie (quad plein écran)
			const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

			const buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

			const positionLocation = gl.getAttribLocation(program, 'position')
			gl.enableVertexAttribArray(positionLocation)
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

			// Démarrer l'animation
			const animate = () => {
				if (!gl || !programRef.current) return

				const currentTime = (Date.now() - startTimeRef.current) / 1000
				const uniforms = uniformsRef.current

				// Mettre à jour les uniforms
				gl.uniform1f(uniforms.timeLocation, currentTime)
				gl.uniform2f(uniforms.resolutionLocation, canvas.width, canvas.height)
				gl.uniform1f(uniforms.turbSpeedLocation, config.turbSpeed)
				gl.uniform1f(uniforms.turbAmpLocation, config.turbAmp)
				gl.uniform1f(uniforms.turbFreqLocation, config.turbFreq)
				gl.uniform1f(uniforms.intensityLocation, config.intensity)

				// Dessiner
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
	}, [])

	return (
		<canvas
			ref={canvasRef}
			data-turbulent-background
			className='fixed inset-0 -z-10 h-full w-full'
			style={{
				filter: 'blur(0.8px) contrast(0.9) brightness(0.8) saturate(1.1)',
				mixBlendMode: 'soft-light',
				opacity: 0.7,
			}}
		/>
	)
}
