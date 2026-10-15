# Diamond '88 API (Cloudflare Worker)

One Worker serves both:
- **2-player relay**: both devices connect to it, so online games work on any network, cellular included.
- **Derby leaderboard** (optional): a shared top 10.
- **Find a match**: `POST /api/match` pairs strangers looking for a game or a derby (uses the same Room Durable Object, so no extra setup).

It runs at `https://diamond88.wellschristmastrees.com/api/*`. The game checks `/api/health` on load and uses whatever is there. With nothing deployed, 2 player falls back to a direct WebRTC connection and the leaderboard stays hidden.

## Deploy (laptop, about 5 minutes)

Needs Node.js. From this folder:

```sh
npx wrangler login          # opens the browser; approve access to your Cloudflare account
npx wrangler deploy         # creates the Worker, the Room Durable Object and the /api/* route
```

Check it: https://diamond88.wellschristmastrees.com/api/health should show `{"ok":true,"rooms":true,...}`.

That's all the game needs for 2 player. Hard-refresh both devices and host or join as usual.

## Turn on the leaderboard (optional)

```sh
npx wrangler kv namespace create LB
```

Paste the `id` it prints into `wrangler.toml` (uncomment the `[[kv_namespaces]]` block), then run `npx wrangler deploy` again. `/api/health` will show `"lb":true` and the derby results screen gets a LEADERBOARD page.

## Updating

After pulling new game changes that touch `worker.js`, run `npx wrangler deploy` again from this folder.

## Notes
- Free plan is plenty: Durable Objects on the free plan use the SQLite backend (`new_sqlite_classes` in `wrangler.toml`).
- The route needs the `diamond88` DNS record to stay **Proxied** (orange cloud).
- Allowed origins are at the top of `worker.js`.
