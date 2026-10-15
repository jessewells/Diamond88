# Diamond '88

An 8-bit baseball game for your phone, in the style of the classic NES baseball games.

**Play:** https://diamond88.wellschristmastrees.com (also https://jessewells.github.io/Diamond88/, which redirects there)

- Single file (`index.html`): HTML, CSS and JavaScript, no build step.
- Phone: on-screen D-pad, A, B, START and SOUND buttons.
- Laptop: arrow keys or WASD to move, X or Space = A, Z = B, Enter = start/pause (P or Esc also pause), M = sound. The on-screen controller hides automatically and a key legend shows under the game.
- Quit a game: pause (START / Enter), then press B (Z on a keyboard) to go back to the menu.
- HR Derby auto-pauses after 3 straight takes, in case you walked away.
- Gamepad: plug in an Xbox, PlayStation or Switch controller (A/Cross = A, B/Circle = B, Start, Select/Back = sound).
- Modes: a full **Game** or the **HR Derby** (10 outs; any swing that isn't a homer is an out; best score is saved on the device).
- Levels: **Rookie**, **Pro** and **All-Star** change your swing window, CPU pitch speed and control, CPU hitters and CPU fielders.
- After each swing the game says how you timed it (PERFECT, GOOD, EARLY or LATE, plus INSIDE or OUTSIDE) and shows where the pitch crossed the plate.
- Your own team: on the title menu go to YOU and pick **+ NEW TEAM**. Type a name and tap GENERATE for a full roster (the same name always generates the same team; generate again for a new roll), or set every name, color and rating yourself. B on YOU edits a saved team.
- Pitcher fatigue: the ARM meter (top right) drains with pitches, hits, runs and walks, and a tired arm loses speed and control. When you're pitching, press B for the bullpen; the CPU goes to its pen on its own.
- Box score: after a game, press left/right for each team's batting and pitching lines.
- Settings, your teams and sound on/off are saved on the device.
- **Share a team:** in the team builder tap SHARE THIS TEAM to send a link. Opening the link loads the team on your friend's device; IMPORT A TEAM takes a pasted link or code.
- **Bench:** every team has 3 bench players. Before the first pitch of an at-bat press B to send up a pinch hitter. The CPU pinch-hits late in close spots.
- **2 Player (online):** host can pick GAME or **HR DERBY** (turns of 5 outs, 2 rounds, ties go to 3-out swing-offs; the CPU throws batting practice and the other player watches live).
- **2 Player game:** each player on their own phone or laptop. One picks 2 PLAYER → HOST A GAME and gets a 4-letter code; the other picks JOIN A GAME and enters it. Each brings their own team (custom teams too). The host's device runs the game and streams it to the other device over a direct WebRTC connection (PeerJS); With the Worker in `worker/` deployed, games go through a Cloudflare relay and work on any network; without it they try a direct connection, which cellular networks often block.
- **Manual fielding (optional):** set FIELDING to MANUAL. Steer the fielder chasing the ball with the d-pad; once he has it, direction + A throws (right 1st, up 2nd, left 3rd, down home) and direction + B runs it to that base. Leave it alone and the fielders play it themselves.
- **Season:** 9 games against 3 other teams with standings, season batting (AVG, HR, RBI) and pitching (IP, ERA, K), saved on the device.
- **Derby leaderboard + 2-player relay:** the Cloudflare Worker in `worker/` (deploy steps in `worker/README.md`) runs both at `/api`. The game finds it automatically.
- On iPhone, open the link, tap Share, then Add to Home Screen to play full-screen.
