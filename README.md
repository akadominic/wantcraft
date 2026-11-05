# Influence Coach

A personal persuasion coach grounded in Robert Cialdini's *Influence: The Psychology of Persuasion*.

- **Learn**: drills on each principle (lesson, spot it, use it, defend, roleplay), scored 0–5, with animated diagrams.
- **Simulate**: describe a real situation, get a plan with exact lines, then rehearse it with the coach playing the other person.
- **Voice**: natural ElevenLabs voices out, your microphone in, and a hands-free conversation mode for roleplays.

Plain static front end (`public/`) plus four small serverless functions (`api/`). No build step and no dependencies.

## Deploy to wantcraft.io

### 1. Get your keys

| Key | Where | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → Settings → API keys | Add credits under Billing. Pay-as-you-go, separate from a Claude subscription. |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Developers → API keys | Give it Text to Speech and Speech to Text access. Optional: without it the app falls back to the device voice. |
| `APP_PASSCODE` | You choose | A long access code. Anyone without it is locked out, so strangers can't spend your API credits. |

### 2. Import into Vercel

1. [vercel.com/new](https://vercel.com/new) → import `akadominic/wantcraft`.
2. Framework preset: **Other**. Leave the build and output settings as they are (`vercel.json` sets them).
3. Under **Environment Variables**, add `APP_PASSCODE`, `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY`.
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
api/tts.js       Natural voice (ElevenLabs text to speech)
api/stt.js       Transcription for browsers without built-in speech recognition (Firefox)
api/check.js     Verifies the access code, reports which services are set up
lib/prompt.js    The coach's instructions, output format and exercise rules
lib/kb.js        The knowledge base: notes on Influence, in our own words
```

- The knowledge base and instructions stay on the server and never reach the browser. They're sent as a cached system prompt, so repeat requests are cheaper.
- Speech input uses the browser's speech recognition (Chrome, Edge, Safari). Other browsers record a clip and transcribe it through `/api/stt`.
- Sessions and progress are saved in the browser on each device. Syncing across devices needs a database and logins; that's the next step if this becomes a product.

## Adding sources

The coach uses only `lib/kb.js`. To add a book, append its notes there in the same format and update the source rules at the top of `lib/prompt.js`, which currently restrict the coach to *Influence*. A commercial version needs rights to any book it's built on.
