addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // The URL you want to forward the request to
  const targetUrl = new URL(request.url).searchParams.get('url')
  
  if (!targetUrl) {
    return new Response('Missing "url" parameter', { status: 400 })
  }

  // Forward the request to the target URL
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })

  // Modify the response to allow CORS
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', '*')

  // Return the modified response
  return new Response(await response.text(), {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  })
}
