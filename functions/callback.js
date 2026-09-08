// Cloudflare Pages Function — step 2 of the GitHub OAuth handshake for Decap CMS.
// GitHub redirects back here with a ?code=..., which we exchange server-side for an access
// token (needs GITHUB_CLIENT_SECRET, which must never be exposed to the browser — that's why
// this exchange has to happen in a function, not in admin/config.yml or client-side JS).
// The response is a tiny HTML page that hands the token back to the /admin popup opener via
// postMessage, following the exact handshake Decap CMS's "github" backend expects.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return htmlResponse(renderMessage('error', { message: 'Missing OAuth code' }));
  }

  const redirectUri = `${url.origin}/callback`;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    return htmlResponse(renderMessage('error', { message: data.error_description || 'GitHub OAuth exchange failed' }));
  }

  return htmlResponse(renderMessage('success', { token: data.access_token, provider: 'github' }));
}

function renderMessage(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html><body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;
}

function htmlResponse(html) {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
