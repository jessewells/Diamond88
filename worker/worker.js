// Diamond '88 derby leaderboard: a Cloudflare Worker with one KV namespace (binding LB).
//   GET  /top    -> top 10 [{n, hr, lvl, d}]
//   POST /score  {n:"ABC", hr:7, lvl:0|1|2} -> updated top 10
const ORIGINS = ['https://jessewells.github.io', 'https://diamond88.wellschristmastrees.com'];
const MAX = 10;

function cors(req) {
  const o = req.headers.get('origin') || '';
  return {
    'access-control-allow-origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'origin',
  };
}
const json = (req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors(req) } });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const { pathname } = new URL(req.url);
    const top = (await env.LB.get('top', 'json')) || [];

    if (pathname === '/top' && req.method === 'GET') return json(req, top);

    if (pathname === '/score' && req.method === 'POST') {
      // one score per IP every 20 seconds
      const ip = req.headers.get('cf-connecting-ip') || 'x';
      if (await env.LB.get('rl:' + ip)) return json(req, { error: 'slow down' }, 429);
      await env.LB.put('rl:' + ip, '1', { expirationTtl: 60 });

      let b;
      try { b = await req.json(); } catch { return json(req, { error: 'bad json' }, 400); }
      const n = String(b.n || '').toUpperCase();
      const hr = Number(b.hr), lvl = Number(b.lvl);
      if (!/^[A-Z]{3}$/.test(n) || !Number.isInteger(hr) || hr < 1 || hr > 60 || ![0, 1, 2].includes(lvl))
        return json(req, { error: 'bad score' }, 400);

      top.push({ n, hr, lvl, d: Date.now() });
      // more homers first, then the harder level, then whoever got there first
      top.sort((a, b) => b.hr - a.hr || b.lvl - a.lvl || a.d - b.d);
      const next = top.slice(0, MAX);
      await env.LB.put('top', JSON.stringify(next));
      return json(req, next);
    }
    return json(req, { error: 'not found' }, 404);
  },
};
