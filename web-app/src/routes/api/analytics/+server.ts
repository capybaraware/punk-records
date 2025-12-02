import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Google Analytics Data API configuration
const GA_PROPERTY_ID = '514866014'; // Numeric property ID
const GA_API_ENDPOINT = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`;

// Get access token using service account JSON
async function getAccessToken(): Promise<string> {
	const serviceAccountJson = env.GA_SERVICE_ACCOUNT_JSON;

	if (!serviceAccountJson) {
		throw new Error('GA_SERVICE_ACCOUNT_JSON environment variable not set');
	}

	let serviceAccount: any;
	try {
		serviceAccount = JSON.parse(serviceAccountJson);
	} catch (e) {
		throw new Error('Invalid GA_SERVICE_ACCOUNT_JSON format. Must be valid JSON.');
	}

	const { client_email, private_key } = serviceAccount;

	if (!client_email || !private_key) {
		throw new Error('Service account JSON must contain client_email and private_key');
	}

	// Create JWT for service account authentication
	let jwt: string;
	try {
		jwt = await createJWT(client_email, private_key);
		console.log('JWT created successfully');
	} catch (jwtError: any) {
		console.error('JWT creation error:', jwtError);
		throw new Error(`Failed to create JWT: ${jwtError.message}`);
	}

	// Exchange JWT for access token
	const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt,
		}),
	});

	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text();
		console.error('Token exchange error:', errorText);
		let errorMessage = `Failed to get access token: ${tokenResponse.statusText}`;
		try {
			const errorJson = JSON.parse(errorText);
			if (errorJson.error_description) {
				errorMessage = errorJson.error_description;
			} else if (errorJson.error) {
				errorMessage = errorJson.error;
			}
		} catch (e) {
			// Use raw error text if parsing fails
		}
		throw new Error(errorMessage);
	}

	const tokenData = await tokenResponse.json();
	return tokenData.access_token;
}

// Create JWT for service account using Web Crypto API
async function createJWT(email: string, privateKey: string): Promise<string> {
	const header = {
		alg: 'RS256',
		typ: 'JWT',
	};

	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: email,
		scope: 'https://www.googleapis.com/auth/analytics.readonly',
		aud: 'https://oauth2.googleapis.com/token',
		exp: now + 3600, // 1 hour
		iat: now,
	};

	// Base64URL encode header and payload
	const base64UrlEncode = (str: string): string => {
		return btoa(str)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const message = `${encodedHeader}.${encodedPayload}`;

	// Import private key - handle newlines properly
	// The private key from the JSON might have \n as literal string or actual newlines
	const keyData = privateKey
		.replace(/-----BEGIN PRIVATE KEY-----/g, '')
		.replace(/-----END PRIVATE KEY-----/g, '')
		.replace(/\\n/g, '\n')  // Replace literal \n with actual newlines first
		.replace(/\n/g, '')     // Then remove all newlines
		.replace(/\s/g, '');    // Remove any remaining whitespace

	const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

	// Import the key using Web Crypto API
	const cryptoKey = await crypto.subtle.importKey(
		'pkcs8',
		keyBuffer.buffer,
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		},
		false,
		['sign']
	);

	// Sign the message
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		cryptoKey,
		new TextEncoder().encode(message)
	);

	// Base64URL encode signature
	const encodedSignature = base64UrlEncode(
		String.fromCharCode(...new Uint8Array(signature))
	);

	return `${message}.${encodedSignature}`;
}

export const GET: RequestHandler = async ({ url }): Promise<Response> => {
	try {
		// Get date range (default to last 30 days)
		const days = parseInt(url.searchParams.get('days') || '30');
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Format dates as YYYY-MM-DD
		const formatDate = (date: Date) => date.toISOString().split('T')[0];

		// Get access token
		const accessToken = await getAccessToken();

		// Multiple requests to get different data sets
		const requests = [
			// Main overview data (date, pagePath)
			{
				dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
				dimensions: [{ name: 'date' }, { name: 'pagePath' }],
				metrics: [
					{ name: 'activeUsers' },
					{ name: 'sessions' },
					{ name: 'screenPageViews' },
					{ name: 'averageSessionDuration' },
				],
				orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
			},
			// Traffic sources (acquisition)
			{
				dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
				dimensions: [{ name: 'date' }, { name: 'sessionSourceMedium' }],
				metrics: [{ name: 'sessions' }],
				orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
			},
			// Countries
			{
				dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
				dimensions: [{ name: 'country' }],
				metrics: [{ name: 'sessions' }],
				orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
				limit: 10,
			},
			// Devices
			{
				dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
				dimensions: [{ name: 'deviceCategory' }],
				metrics: [{ name: 'sessions' }],
				orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
			},
		];

		// Fetch all data in parallel
		const responses = await Promise.all(
			requests.map(async (requestBody) => {
				const response = await fetch(GA_API_ENDPOINT, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				if (!response.ok) {
					const errorData = await response.text();
					console.error('GA API Error:', errorData);
					throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
				}

				return response.json();
			})
		);

		// Combine all responses
		const data = {
			overview: responses[0],
			acquisition: responses[1],
			countries: responses[2],
			devices: responses[3],
		};

		return json(data);

	} catch (err: any) {
		console.error('Analytics API error:', err);
		console.error('Error details:', {
			message: err.message,
			status: err.status,
			stack: err.stack
		});
		if (err.status) {
			throw err;
		}
		const errorMessage = err.message || 'Failed to fetch analytics data';
		console.error('Throwing error:', errorMessage);
		throw error(500, errorMessage);
	}
};
