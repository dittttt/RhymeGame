# RhymeGame Deployment Setup

This file lists exactly what is still needed to make the hosted Vercel + Supabase version work.

## 1. Required accounts / tokens

Hermes installed the local CLIs, but both services still need login tokens:

- GitHub CLI installed at `~/.local/bin/gh`, but the existing token is missing the `read:org` scope for `gh auth login`.
- Vercel CLI works but is not logged in.
- Supabase CLI works but is not logged in.

## 2. GitHub push setup

Option A - browser login:

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login
# GitHub.com
# HTTPS
# Login with browser
gh auth setup-git
cd /mnt/c/Users/ditto/Desktop/CODES/RhymeGame
git push -u origin main
```

Option B - token login:

Create a GitHub token with at least:

- `repo`
- `workflow`
- `read:org`

Then:

```bash
export PATH="$HOME/.local/bin:$PATH"
echo "YOUR_TOKEN" | gh auth login --with-token
gh auth setup-git
cd /mnt/c/Users/ditto/Desktop/CODES/RhymeGame
git push -u origin main
```

## 3. Supabase project named RhymeGame

Browser/manual route:

1. Go to https://supabase.com/dashboard/projects
2. New project
3. Name: `RhymeGame`
4. Save the project URL and anon key
5. SQL Editor → paste and run `supabase/schema.sql`

CLI route after login:

```bash
npm exec --yes supabase -- login
npm exec --yes supabase -- projects create RhymeGame
```

Then link the local project when you have the project ref:

```bash
npm exec --yes supabase -- link --project-ref YOUR_PROJECT_REF
npm exec --yes supabase -- db push
```

## 4. Vercel project named RhymeGame

Browser/manual route:

1. Go to https://vercel.com/new
2. Import `dittttt/RhymeGame`
3. Project name: `RhymeGame`
4. Framework: Next.js
5. Add environment variables below
6. Deploy

CLI route after login:

```bash
npm exec --yes vercel -- login
npm exec --yes vercel -- link --project RhymeGame
npm exec --yes vercel -- env add NEXT_PUBLIC_SUPABASE_URL production
npm exec --yes vercel -- env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npm exec --yes vercel -- env add YOUTUBE_API_KEY production
npm exec --yes vercel -- env add SOUNDCHARTS_APP_ID production
npm exec --yes vercel -- env add SOUNDCHARTS_API_KEY production
npm exec --yes vercel -- deploy --prod
```

## 5. Environment variables

Required for hosted MVP:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=
```

Optional for existing-song instrumental metadata lookup:

```bash
SOUNDCHARTS_APP_ID=
SOUNDCHARTS_API_KEY=
```

Future possible provider keys:

```bash
TUNEBAT_API_KEY=
GETSONGBPM_API_KEY=
```

## 6. Beat metadata policy

- Type beat search uses YouTube Data API and parses BPM/time signature from the title/full description.
- Results without BPM are rejected by default.
- Missing time signature is assumed as `4/4` and labelled as assumed.
- Existing commercial song instrumentals should use licensed metadata provider APIs like Soundcharts, Tunebat API, or GetSongBPM API. Do not scrape protected sites without API permission.
