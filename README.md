# Food Manager

A comprehensive food management system with recipe scraping, inventory tracking, and meal planning.

## Features

- 🍳 **Recipe Scraping** - Extract recipes from YouTube, Instagram, and TikTok
- 📱 **Smart Inventory** - Track food items with expiry alerts
- 🛒 **Shopping Lists** - Generate lists from recipes and inventory
- 📅 **Meal Planning** - Plan meals and track nutrition
- 🔍 **Receipt Scanning** - OCR-powered receipt processing
- 👤 **User Accounts** - Secure authentication and personal collections

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Scraping**: Apify
- **State Management**: React Query
- **UI Components**: Custom components with Tailwind

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Apify account (for recipe scraping)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kickikuang-eng/foodmanager.git
cd foodmanager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.template .env.local
```

4. Configure your environment variables in `.env.local`:
   - Get your Supabase URL and keys from your Supabase project
   - Get your Apify API token from your Apify account
   - Add other service credentials as needed

5. Set up the database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema-safe.sql` in your Supabase SQL editor

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Environment Configuration

1. Copy env template and fill in values:
```bash
cp env.template .env.local
```

2. Required keys (see `env.template` for the full list):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APIFY_API_TOKEN` and one of `APIFY_ACTOR_ID_*` (YouTube/Instagram/TikTok)
- `OPENAI_API_KEY` (for YouTube recipe extraction)
- Optional service keys: OCR, Email, Redis, Cloudinary, etc.

3. Instagram/Facebook setup:
- Follow `facebook-instagram-setup.md` and `INSTAGRAM_SCRAPING_DOCUMENTATION.md`
- Do not commit real secrets. Use placeholders in docs and set real values only in `.env.local`.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users** - User profiles and authentication
- **Recipes** - Recipe storage with ingredients and instructions
- **Collections** - Recipe organization folders
- **Food Items** - Inventory tracking with expiry dates
- **Shopping Lists** - Grocery list management
- **Meal Plans** - Weekly meal planning
- **Scraping Jobs** - Recipe extraction from social media

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Scripts

```bash
npm run dev         # Start Next.js in development
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run Next.js ESLint
npm run type-check  # TypeScript type checking
```

## API Endpoints (App Router)

- `GET /api/auth/instagram?userId=<uuid>` — Get Instagram OAuth URL
- `POST /api/auth/instagram` — Handle Instagram OAuth callback
- `POST /api/scrape` — Main scrape endpoint (supports `platform`: youtube | instagram | tiktok)
- `GET /api/scrape/status?jobId=<id>` — Check scrape job status
- `POST /api/instagram/scrape` — Instagram API scrape
- `GET /api/test-apify` — Verify Apify configuration
- `GET /api/test-actors` — Debug available actors

## Documentation

- `APIFY_SETUP.md` — Apify quick setup
- `INSTAGRAM_SCRAPING_DOCUMENTATION.md` — Full Instagram integration guide
- `INSTAGRAM_QUICK_REFERENCE.md` — Instagram quick-start
- `facebook-instagram-setup.md` — Facebook app configuration
- `instagram-config-setup.md` — Instagram scraping config notes
- `UI_DEVELOPMENT_GUIDE.md` — UI patterns and conventions

## Security

- Secrets must never be committed. Use `.env.local` and keep docs with placeholders.
- `.next/`, `.vercel/`, `out/`, and `coverage/` are ignored via `.gitignore`.