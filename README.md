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
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

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