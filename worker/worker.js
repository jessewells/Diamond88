// Diamond '88 API: one Cloudflare Worker for the online 2-player relay and the derby leaderboard.
// Served at https://diamond88.wellschristmastrees.com/api/* (a route) or the workers.dev URL.
//
//   GET  /health         -> {ok, rooms, lb}  (the game probes this to decide whether to use the relay)
//   WS   /room/ABCD?role=host|guest           2-player relay: whatever one side sends, the other receives
//   GET  /top            -> top 10 by homers [{n, hr, lvl, d}]   (needs the LB KV binding)
//   GET  /long           -> top 10 longest homers [{n, ft, lvl, d}]
//   POST /score {n,hr,lvl,ft} -> updated top 10 by homers (ft = that derby's longest homer, optional)
const ORIGINS = ['https://diamond88.wellschristmastrees.com', 'https://jessewells.github.io'];
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
    const path = new URL(req.url).pathname.replace(/^\/api(?=\/)/, '');   // works on the route and on workers.dev

    if (path === '/health') return json(req, { ok: true, rooms: !!env.ROOMS, lb: !!env.LB });

    const room = path.match(/^\/room\/([A-Z]{4})$/);
    if (room) {
      if (!env.ROOMS) return json(req, { error: 'relay not configured' }, 503);
      if (req.headers.get('upgrade') !== 'websocket') return json(req, { error: 'expected websocket' }, 426);
      return env.ROOMS.get(env.ROOMS.idFromName(room[1])).fetch(req);
    }

    if (!env.LB) return json(req, { error: 'leaderboard not configured' }, 503);
    const top = (await env.LB.get('top', 'json')) || [];
    if (path === '/top' && req.method === 'GET') return json(req, top);
    if (path === '/long' && req.method === 'GET') return json(req, (await env.LB.get('long', 'json')) || []);

    if (path === '/score' && req.method === 'POST') {
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

      const ft = Number(b.ft);
      if (Number.isInteger(ft) && ft >= 300 && ft <= 700) {
        const long = (await env.LB.get('long', 'json')) || [];
        long.push({ n, ft, lvl, d: Date.now() });
        long.sort((a, b) => b.ft - a.ft || b.lvl - a.lvl || a.d - b.d);
        await env.LB.put('long', JSON.stringify(long.slice(0, MAX)));
      }

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

// One Durable Object per game code. It holds the host's and the guest's sockets and passes
// messages straight through. Control messages from the relay itself start with "_".
export class Room {
  constructor(state) { this.state = state; }

  async fetch(req) {
    const role = new URL(req.url).searchParams.get('role') === 'host' ? 'host' : 'guest';
    const n = r => this.state.getWebSockets(r).length;
    // turned-away sockets get the tag "x" so closing them doesn't disturb the real players
    const err = role === 'host' ? (n('host') ? 'taken' : '') : (!n('host') ? 'nogame' : n('guest') ? 'full' : '');
    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server, [err ? 'x' : role]);
    const say = (ws, o) => { try { ws.send(JSON.stringify(o)); } catch {} };

    if (err) { say(server, { t: '_err', e: err }); server.close(4000, err); }
    else if (role === 'host') say(server, { t: '_ok' });
    else {
      say(server, { t: '_peer' });
      for (const h of this.state.getWebSockets('host')) say(h, { t: '_peer' });
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, msg) {
    if (this.state.getTags(ws)[0] === 'x') return;
    const other = this.state.getTags(ws)[0] === 'host' ? 'guest' : 'host';
    for (const o of this.state.getWebSockets(other)) { try { o.send(msg); } catch {} }
  }

  webSocketClose(ws) {
    const role = this.state.getTags(ws)[0], other = role === 'host' ? 'guest' : 'host';
    if (role === 'x') return;
    for (const o of this.state.getWebSockets(other)) {
      try { o.send(JSON.stringify({ t: '_left' })); if (role === 'host') o.close(1000, 'host left'); } catch {}
    }
  }

  webSocketError(ws) { this.webSocketClose(ws); }
}
