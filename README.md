# VisionDescribe

AI-powered content generation for e-commerce and marketplace platforms. Uses Claude Opus 4.8 (with adaptive thinking) to generate brand-compliant product descriptions, bullet points, and optimized copy, with real-time cost tracking and multi-language support.

Built with React, TypeScript, and Vercel Edge Functions.

## Features

- **Multi-platform support** — Inriver (e-commerce), Amazon (listings + A+ content), NEXT (UK market), About You (style-led), Partoo (store locations)
- **Batch processing** — handles large product catalogs (1000+ items) with hybrid client-side and server-side pipelines
- **Real-time cost tracking** — precise token usage monitoring with provider-specific pricing per operation
- **Image analysis** — upload product images and generate descriptions using vision models
- **Color and size translation** — deterministic mappings (e.g. DE→EN colors, EU→GB sizes) for consistent output
- **Content validation** — forbidden word detection, character limits, and policy compliance
- **Multi-language** — content generation and translation across 50+ languages
- **Smart column detection** — automatic field mapping and use case identification from uploaded files
- **Multi-format support** — Excel (.xlsx, .xlsm), CSV, and JSON file processing
- **Dark/Light mode** — professional theming with user preference support

## AI Model

All flows run on a single model, Claude Opus 4.8, with adaptive thinking at medium effort.

| Model | Provider | Context | Notes |
|-------|----------|---------|-------|
| Claude Opus 4.8 | Anthropic | 1M | Most capable Anthropic model; adaptive thinking, native vision |

## Supported Platforms

| Platform | Description |
|----------|-------------|
| **E-commerce (Inriver)** | Product descriptions and material content optimization |
| **Amazon** | Listings optimization with bullet points, descriptions, and A+ content |
| **NEXT** | Product titles and copy for the UK market (British English, 30-55 family-oriented audience) |
| **About You** | Style names and long descriptions for the style-led 18-35 demographic |
| **Partoo** | Store location descriptions with brand Tone of Voice compliance |

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key
- Supabase project (for auth and data persistence)

### Installation

```bash
git clone https://github.com/filippodanesi/vision-describe.git
cd vision-describe
npm install
npm run dev
```

### Configuration

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_ANTHROPIC_API_KEY` | No | Anthropic API key (can also be set in-app) |

Server-side (Vercel) also requires `ANTHROPIC_API_KEY`.

## Architecture

```
src/
├── pages/                        # Route pages (Index, Login, Changelog)
├── components/
│   ├── AppShell/                 # Main layout and navigation
│   ├── GenerateMode/             # Image analysis and CSV translation
│   │   ├── components/
│   │   │   ├── ImageAnalysis/    # Product image processing
│   │   │   ├── CsvTranslation/  # Batch CSV translation
│   │   │   └── SubModeSelector/  # Feature selector
│   │   ├── prompts/              # AI prompts
│   │   └── hooks/                # Custom hooks
│   ├── OptimizeMode/             # Batch file processing and optimization
│   │   ├── components/           # UI panels and forms
│   │   ├── processing/           # File processing logic
│   │   └── utils/
│   │       ├── sanitizers/       # Text validation
│   │       ├── prompts/          # AI prompts
│   │       └── translations/     # Language mappings
│   ├── Dashboard/                # Analytics and statistics
│   ├── Projects/                 # Project management
│   ├── Settings/                 # User settings and API keys
│   └── ui/                       # shadcn/UI component library
├── contexts/
│   ├── AuthContext.tsx            # Supabase auth state
│   └── ApiKeysContext.tsx         # User API keys storage
├── lib/
│   ├── api/                      # API clients (Anthropic, server)
│   ├── models.ts                 # AI model definitions and pricing
│   ├── supabase.ts               # Supabase client
│   └── prompts/                  # Shared prompt templates
└── config/
    └── env.ts                    # Environment helpers

api/                              # Vercel Edge Functions
├── start-run.ts                  # Initiate processing
├── process-run.ts                # Execute batch processing
├── process-run-chain.ts          # Multi-step pipeline
├── resume-run.ts                 # Resume interrupted runs
├── cancel-run.ts                 # Cancel running task
└── _lib/
    ├── types.ts                  # Shared API types
    ├── aiClients.ts              # AI model clients
    ├── processors.ts             # Data processing logic
    └── supabaseAdmin.ts          # Admin Supabase client

supabase/migrations/              # Database schema
├── 001_create_tables.sql         # Runs and results tables
├── 002_projects_and_settings.sql # Projects and API keys
├── 003_server_processing.sql     # Server processing schema
└── 004_realtime_run_results.sql  # Real-time updates
```

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 18 + TypeScript | Type-safe user interface |
| Styling | Tailwind CSS + Radix UI | Accessible design system |
| State | TanStack React Query | Server state management |
| Routing | React Router DOM | Client-side routing |
| File Processing | ExcelJS + Papa Parse | Excel and CSV handling |
| AI Integration | Anthropic SDK | Language model integration |
| Auth & Database | Supabase (PostgreSQL) | Authentication and data persistence |
| Deployment | Vercel | Edge Functions + static hosting |

## Security and Privacy

- **Local processing** — all data processed locally, zero external storage
- **Supabase Auth** — email/password authentication with Row-Level Security
- **HTTP Basic Auth** — Vercel Edge Middleware for access control
- **GDPR compliant** — no product data stored or transmitted beyond processing

## Development

```bash
npm run dev        # Start Vite dev server on port 8080
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## License

This project is **dual-licensed**:

- **Non-Commercial**: [CC BY-NC-SA 4.0](LICENSE) — Free for personal and educational use
- **Commercial**: Contact for licensing

Copyright (c) 2025-present Filippo Danesi — filippo.danesi93@gmail.com
