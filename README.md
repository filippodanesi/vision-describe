<div align="center">

# VisionDescribe

**AI-powered content generation for e-commerce and marketplace platforms**

[![License](https://img.shields.io/badge/License-Dual--licensed-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)

*Transform your product catalogs with AI-powered content generation, real-time cost tracking, and multi-language support*

[Overview](#overview) • [Supported Platforms](#supported-platforms) • [Quick Start](#quick-start) • [License](#license)

</div>

---

## Overview

**VisionDescribe** is an enterprise solution for AI-powered content creation across e-commerce and marketplace platforms. Built with React and TypeScript, it leverages advanced AI models (GPT-5.2, Claude Opus 4.6, Claude Sonnet 4.5) to generate high-quality, brand-compliant product descriptions, bullet points, and optimized copy — with real-time cost tracking and multi-language support.

---

## Supported Platforms

| Platform | Description |
|----------|-------------|
| **E-commerce (Inriver)** | Product descriptions and material content optimization |
| **Amazon** | Listings optimization with bullet points, descriptions, and A+ content |
| **NEXT** | Product titles and copy for the UK market (British English, 30-55 family-oriented audience) |
| **About You** | Style names and long descriptions for the style-led 18-35 demographic |
| **Partoo** | Store location descriptions with brand Tone of Voice compliance |

---

## AI Models

| Model | Provider | Context | Notes |
|-------|----------|---------|-------|
| **GPT-5.2** | OpenAI | 400K | Flagship model, best value |
| **Claude Opus 4.6** | Anthropic | 200K | Highest intelligence and reasoning |
| **Claude Sonnet 4.5** | Anthropic | 200K | Fast, great balance of quality and speed |

---

## Features

- **Multi-Format Support** — Excel (.xlsx, .xlsm), CSV, and JSON file processing
- **Smart Column Detection** — Automatic field mapping and use case identification
- **Batch Processing** — Handles large product catalogs (1000+ items)
- **Real-Time Cost Tracking** — Precise token usage monitoring with provider-specific pricing
- **Color & Size Translation** — Deterministic mappings (e.g. DE→EN colors, EU→GB sizes)
- **Content Validation** — Forbidden word detection, character limits, policy compliance
- **Multi-Language** — Content generation and translation across 50+ languages
- **Dark/Light Mode** — Professional theming with user preference support

---

## Quick Start

### Prerequisites

- **Node.js** 18.0+
- **OpenAI API Key** and/or **Anthropic API Key**

### Installation

```bash
git clone https://github.com/filippodanesi/ai-copy-assistant.git
cd ai-copy-assistant
npm install
npm run dev
```

### Configuration

```bash
cp .env.example .env.local
echo "VITE_OPENAI_API_KEY=your_openai_key" >> .env.local
echo "VITE_ANTHROPIC_API_KEY=your_anthropic_key" >> .env.local
```

---

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + TypeScript | Type-safe user interface |
| **Styling** | Tailwind CSS + Radix UI | Accessible design system |
| **File Processing** | ExcelJS + Papa Parse | File handling and parsing |
| **AI Integration** | OpenAI API + Anthropic API | Language model integration |
| **Deployment** | Vercel | Production hosting with Edge Middleware |

---

## Security & Privacy

- **Local Processing** — All data processed locally, zero external storage
- **API Security** — Secure API key management
- **HTTP Basic Auth** — Vercel Edge Middleware for access control
- **GDPR Compliant** — No product data stored or transmitted

---

## License

This project is **dual-licensed**:

- **Non-Commercial**: [CC BY-NC-SA 4.0](LICENSE) — Free for personal and educational use
- **Commercial**: Contact for licensing

### Contact

- **Email**: [filippo.danesi93@gmail.com](mailto:filippo.danesi93@gmail.com)
- **Website**: [filippodanesi.com](https://www.filippodanesi.com)

---

<div align="center">

**Built by [Filippo Danesi](https://www.filippodanesi.com)**

[![GitHub](https://img.shields.io/badge/GitHub-filippodanesi-black?style=social&logo=github)](https://github.com/filippodanesi)

</div>
