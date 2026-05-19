# RhymeGame Access Handoff

This file explains how to give Hermes enough access to finish Vercel + Supabase deployment without pasting secrets into chat history.

## Preferred: put tokens in Hermes local env

Edit this local file:

```text
/home/ditto/.hermes/.env
```

Add these lines:

```bash
VERCEL_TOKEN=your_vercel_token_here
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here
RHYMEGAME_SUPABASE_PROJECT_REF=your_project_ref_here
RHYMEGAME_SUPABASE_URL=https://your-project-ref.supabase.co
RHYMEGAME_SUPABASE_ANON_KEY=your_anon_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

Then tell Hermes: "I added the RhymeGame tokens, continue deployment."

Do not paste keys in Telegram if you can avoid it.

## Where to get Vercel token

1. Open https://vercel.com/account/tokens
2. Create token, name: `Hermes RhymeGame deploy`
3. Scope: your personal account/team that owns RhymeGame
4. Expiration: choose short if possible, e.g. 30 days
5. Copy token to `/home/ditto/.hermes/.env` as `VERCEL_TOKEN=...`

## Where to get Supabase token

1. Open https://supabase.com/dashboard/account/tokens
2. Generate new access token, name: `Hermes RhymeGame deploy`
3. Copy token to `/home/ditto/.hermes/.env` as `SUPABASE_ACCESS_TOKEN=...`

## Where to get Supabase project ref, URL, and anon key

Inside your existing Supabase `RhymeGame` project:

1. Open Project Settings → General
2. Copy `Reference ID` to:
   ```bash
   RHYMEGAME_SUPABASE_PROJECT_REF=
   ```
3. Open Project Settings → API
4. Copy Project URL to:
   ```bash
   RHYMEGAME_SUPABASE_URL=
   ```
5. Copy `anon public` key to:
   ```bash
   RHYMEGAME_SUPABASE_ANON_KEY=
   ```

## Where to get YouTube API key

1. Open https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Enable YouTube Data API v3
3. Open Credentials
4. Create API key
5. Copy to:
   ```bash
   YOUTUBE_API_KEY=
   ```

## What Hermes will run after tokens exist

```bash
cd /mnt/c/Users/ditto/Desktop/CODES/RhymeGame

export VERCEL_TOKEN=...
export SUPABASE_ACCESS_TOKEN=...

npm exec --yes supabase -- link --project-ref "$RHYMEGAME_SUPABASE_PROJECT_REF"
npm exec --yes supabase -- db push

npm exec --yes vercel -- link --yes --project RhymeGame --token "$VERCEL_TOKEN"
npm exec --yes vercel -- env add NEXT_PUBLIC_SUPABASE_URL production --token "$VERCEL_TOKEN"
npm exec --yes vercel -- env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN"
npm exec --yes vercel -- env add YOUTUBE_API_KEY production --token "$VERCEL_TOKEN"
npm exec --yes vercel -- deploy --prod --token "$VERCEL_TOKEN"
```
