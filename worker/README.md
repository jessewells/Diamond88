# Derby leaderboard (Cloudflare Worker)

The game shows a shared top-10 HR Derby board once this Worker is running and its URL is set in `index.html`.

## Set up in the Cloudflare dashboard (no command line needed)

1. **Workers & Pages → KV → Create namespace.** Name it `diamond88-lb`.
2. **Workers & Pages → Create → Worker.** Name it `diamond88-lb` and click Deploy.
3. **Edit code:** replace everything with the contents of `worker.js` and click Deploy.
4. **Settings → Bindings → Add → KV namespace.** Variable name `LB`, namespace `diamond88-lb`. Save and deploy.
5. Copy the Worker's URL (like `https://diamond88-lb.<your-subdomain>.workers.dev`).
6. In `index.html`, set `const LB_URL='https://diamond88-lb.<your-subdomain>.workers.dev';` and commit.

Check it: open `<worker url>/top` in a browser. You should see `[]`.

## Or with Wrangler

```sh
cd worker
npx wrangler kv namespace create LB     # paste the id into wrangler.toml
npx wrangler deploy
```

Allowed origins are listed at the top of `worker.js` (`jessewells.github.io` and `diamond88.wellschristmastrees.com`).
