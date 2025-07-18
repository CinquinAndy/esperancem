/**
 * Centralized utilities for common operations
 * Eliminates duplication across API routes and services
 */

export interface ApiResponse<T = any> {
	success: boolean
	data?: T
	error?: string
	message?: string
	timestamp?: string
	cached?: boolean
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
	success: boolean,
	data?: T,
	error?: string,
	message?: string
): ApiResponse<T> {
	const response: ApiResponse<T> = {
		success,
		timestamp: new Date().toISOString(),
	}

	if (data !== undefined) {
		response.data = data
	}

	if (error) {
		response.error = error
	}

	if (message) {
		response.message = message
	}

	return response
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
	data: T,
	message?: string
): ApiResponse<T> {
	return createApiResponse(true, data, undefined, message)
}

/**
 * Create an error response
 */
export function createErrorResponse(
	error: string,
	statusCode: number = 500
): { response: ApiResponse; status: number } {
	return {
		response: createApiResponse(false, undefined, error),
		status: statusCode,
	}
}

/**
 * Handle errors consistently across the application
 */
export function handleError(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}

	if (typeof error === 'string') {
		return error
	}

	return 'Unknown error occurred'
}

/**
 * Log operations consistently
 */
export function logOperation(
	operation: string,
	success: boolean,
	details?: string
) {
	const emoji = success ? '✅' : '❌'
	const status = success ? 'completed' : 'failed'

	console.info(
		`${emoji} ${operation}: ${status}${details ? ` - ${details}` : ''}`
	)
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(requiredVars: string[]): string[] {
	const missing: string[] = []

	for (const varName of requiredVars) {
		if (!process.env[varName]) {
			missing.push(varName)
		}
	}

	return missing
}
