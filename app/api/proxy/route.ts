import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Parse the request body
  const body = await request.json();
  const { endpoint, method, params, requestBody } = body;
  
  const apiBase = process.env.API_BASE || 'http://localhost:3001';
  const url = new URL(`${apiBase}${endpoint}`);
  
  // Add any query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  try {
    const response = await fetch(url, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Error making API request' }, { status: 500 });
  }
}