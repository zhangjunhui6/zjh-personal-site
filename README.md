# ZJH Personal Site

Warm Studio personal website built with Astro, Markdown/MDX, and Tailwind CSS.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Docker

Development server:

```bash
docker compose up --build
```

Open <http://localhost:4321>.

Static production-like preview:

```bash
docker build -t zjh-personal-site .
docker run --rm -p 4321:4321 zjh-personal-site
```

Or run it through Compose on <http://localhost:4322>:

```bash
docker compose --profile preview up --build preview
```

The Compose setup defaults Keystatic to local storage. Add a `.env` file based on `.env.example` when you need GitHub-backed Keystatic credentials.

## Deployment

Deploy to Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
