// Cloudflare Pages Function — step 1 of the GitHub OAuth handshake for Decap CMS.
// Visiting /auth (opened by Decap CMS in a popup) redirects the user to GitHub's
// own login/authorize screen. Needs GITHUB_CLIENT_ID set as a Pages environment variable.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/callback`;

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'repo,user');

  return Response.redirect(authorizeUrl.toString(), 302);
}
