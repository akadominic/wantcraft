# Influence Coach

A personal persuasion and negotiation coach grounded in two books: Robert Cialdini's *Influence: The Psychology of Persuasion* and Chris Voss's *Never Split the Difference*.

- **Learn**: drills on each principle (lesson, spot it, use it, defend, roleplay), scored 0–5, with animated diagrams.
- **Simulate**: describe a real situation, get a plan with exact lines, then rehearse it with the coach playing the other person.
- **Voice**: natural AI voices out (Fish Audio or ElevenLabs), your microphone in, and a hands-free conversation mode for roleplays.

Plain static front end (`public/`) plus four small serverless functions (`api/`). No build step and no dependencies.

## Deploy to wantcraft.io

### 1. Get your keys

| Key | Where | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → Settings → API keys | Add credits under Billing. Pay-as-you-go, separate from a Claude subscription. |
| `FISH_API_KEY` | [fish.audio](https://fish.audio) → API → API keys | Recommended voice provider (cheaper). Add API credit. |
| `FISH_VOICE_ID` | Open a voice you like on fish.audio and copy its ID from the page | The default coach voice. You can also paste a voice ID in the app's settings. |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Developers → API keys | Alternative to Fish Audio. Give it Text to Speech and Speech to Text access. |
| `APP_PASSCODE` | You choose | A long access code. Anyone without it is locked out, so strangers can't spend your API credits. |

### 2. Import into Vercel

1. [vercel.com/new](https://vercel.com/new) → import `akadominic/wantcraft`.
2. Framework preset: **Other**. Leave the build and output settings as they are (`vercel.json` sets them).
3. Under **Environment Variables**, add `APP_PASSCODE`, `ANTHROPIC_API_KEY`, `FISH_API_KEY` and `FISH_VOICE_ID`. Without a voice key, the app uses the device voice.
4. Click **Deploy**. You get a `*.vercel.app` link; open it and enter your access code.

### 3. Point wantcraft.io at it

1. In the Vercel project: **Settings → Domains → Add** `wantcraft.io` (and `www.wantcraft.io`). To keep the root domain free for something else, use a subdomain like `coach.wantcraft.io` instead.
2. Vercel shows the DNS records to add. Add them at your domain registrar. HTTPS is automatic once DNS resolves (minutes to a few hours).

### 4. Put it on your phone

- **iPhone (Safari)**: open the site → Share → **Add to Home Screen**.
- **Android (Chrome)**: menu → **Install app**.

The first time you tap the mic, allow microphone access.

## Settings you can change

| Variable | Default | What it does |
|---|---|---|
| `COACH_MODEL` | `claude-sonnet-5-5` | Use `claude-opus-5-5` for deeper coaching at higher cost, or `claude-haiku-5-5` for speed. |
| `TTS_PROVIDER` | automatic | `fish` or `elevenlabs`. By default Fish Audio is used if its key is set, otherwise ElevenLabs. |
| `FISH_MODEL` | `s2.1-pro` | Fish Audio voice model. |
| `ELEVENLABS_VOICE_ID` | Rachel | Default voice. In the app, Progress → Settings lets you pick another voice or paste any voice ID from your ElevenLabs library. |
| `ELEVENLABS_MODEL` | `eleven_flash_v2_5` | Low-latency voice model. |

After changing a variable in Vercel, redeploy (Deployments → ⋯ → Redeploy).

## Run it on your computer

```bash
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:3000
```

Node 20 or newer.

## How it's built

```
public/          The app: index.html, app.js, styles.css, icons, manifest
api/coach.js     Streams the coach's reply from the Claude API
api/tts.js       Natural voice (Fish Audio or ElevenLabs)
api/stt.js       Transcription for browsers without built-in speech recognition (Firefox)
api/check.js     Verifies the access code, reports which services are set up
lib/prompt.js    The coach's instructions, output format and exercise rules
lib/kb.js        Notes on Influence, in our own words (cited by chapter and page)
lib/kb-voss.js   Notes on Never Split the Difference, in our own words (cited by chapter)
lib/voice.js     Picks the voice provider
```

- The knowledge base and instructions stay on the server and never reach the browser. They're sent as a cached system prompt, so repeat requests are cheaper.
- Speech input uses the browser's speech recognition (Chrome, Edge, Safari). Other browsers record a clip and transcribe it through `/api/stt`.
- Sessions and progress are saved in the browser on each device. Syncing across devices needs a database and logins; that's the next step if this becomes a product.

## Adding sources

The coach uses only the notes in `lib/kb.js` and `lib/kb-voss.js`. To add a book: write its notes in a new `lib/kb-<name>.js`, include it in `buildSystem` in `lib/prompt.js`, add its techniques to `PMAP` there and to `P` in `public/app.js` (with colors in `public/styles.css`), and update the source rules at the top of `IDENTITY`. A commercial version needs rights to any book it's built on.

## Speed

Replies show as soon as their text is ready; diagrams are drawn after the text and fill in a few seconds later, while you can already answer. Diagrams are limited to lesson openings, Simulate plans and final recaps. The system prompt and the conversation so far are cached between turns.
