# KTY-01 — AI Administrator Kitty

A responsive starter web app with a Cloudflare Worker API. Includes chat UI, personality settings, browser-local conversation history, opt-in memory notes, story/coding modes, image-generation API wiring, and browser speech input/output.

## What's working in this starter

- Responsive dark purple UI
- Chat history and user-approved memory notes saved in browser `localStorage`
- Personality and display-name settings
- Story Studio and Coding Lab use the chat endpoint with task-specific instructions
- Voice dictation where browser speech recognition is supported
- Text-to-speech: double-click an assistant response
- Backend routes `/api/chat`, `/api/image`, `/api/health`
- API key remains server-side as a Worker secret

## Requirements

- Node.js 20+ recommended
- A Cloudflare account for deployment
- An AI API key with access to the configured chat and image models; usage may incur charges

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your API key as a local Worker secret:

   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```

   For local development, Wrangler may prompt for the secret; alternatively use a `.dev.vars` file containing `OPENAI_API_KEY=your_key` (do not commit this file).

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Wrangler.

The app UI can be explored without a key, but AI responses need a configured key and a working provider account.

## Deploy

1. Authenticate:

   ```bash
   npx wrangler login
   ```

2. Set the production secret:

   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```

3. Deploy:

   ```bash
   npm run deploy
   ```

Wrangler will print the deployed URL.

## Configure

Edit `wrangler.toml` to change `OPENAI_CHAT_MODEL` or `OPENAI_IMAGE_MODEL`. Optional variables:
- `OPENAI_CHAT_URL`: compatible chat-completions endpoint
- `OPENAI_IMAGE_URL`: compatible image-generation endpoint
- `ALLOWED_ORIGIN`: restrict browser origins in production (set to your exact deployed origin)

## Important limitations / next steps

- This is a starter, not a fully production-hardened service. Add authentication, rate limiting, request quotas, abuse prevention, and observability before sharing it publicly.
- Browser `localStorage` is device/browser-specific and is not synced across devices. The user can clear it through browser settings.
- Do not store secrets, passwords, or sensitive personal data in memory notes.
- Speech recognition depends on browser support and may send audio to the browser's speech service. Text-to-speech uses the browser's built-in voices.
- The Image Studio requests an image from the configured API. Provider responses may return base64 instead of a URL; this starter reports that case instead of persisting image files. Add object storage (for example, R2) for durable image delivery.
- The chat endpoint accepts only user/assistant messages from the client; it does not execute generated code.
- Set `ALLOWED_ORIGIN` to the deployed website origin before public use; `*` is only a convenient development default.
