# Private song likes — Netlify setup

This site has like buttons for six songs, no comments, and no public totals.

## How it works
- Each browser receives a random local visitor ID and can like or unlike each song.
- Likes are stored in Netlify Blobs via serverless functions, not just in the visitor's browser.
- Visitors cannot request the aggregate totals from the public API.
- Like counts are approximate, not a verified count of unique people: visitors can clear browser data, use another browser, or submit automated requests.
- The buttons also appear on upcoming songs. Remove them from any unreleased songs if you prefer to restrict engagement to released tracks.

## Required setup
1. Ensure Netlify deploys this repository and installs npm dependencies from package.json. Netlify Functions are in netlify/functions.
2. In Netlify site settings, set an environment variable named `SONG_LIKES_ADMIN_TOKEN` to a long random secret (at least 32 random characters). Scope it to Functions and redeploy. Do not commit the secret.
3. Deploy, open your website, click a heart, and confirm the success message. If saving fails, inspect the Netlify Function logs for `song-like`.
4. To see private counts, visit `/admin-likes.html` and enter the admin token. The token is only used for that request and is not saved in the page.

## Notes
- No public comments, dislikes, or public like counts are enabled.
- The dashboard URL is not secret; the token protects the counts. Keep the token private.
- Netlify Blobs is subject to your Netlify plan's usage and limits.
- If the site is deployed somewhere other than Netlify, the serverless endpoints will need an equivalent backend.
