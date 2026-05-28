import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/OptimizeMode/components/Header';
import Footer from '@/components/OptimizeMode/components/Footer';

type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  items?: string[];
};

const entries: ChangelogEntry[] = [
  {
    version: "v3.0.0",
    date: "February 18, 2026",
    title: "Projects & Per-User API Keys",
    description:
      "Major platform evolution: API keys are now stored per-user in Supabase (no more shared env vars), and runs can be organized into projects with aggregated stats.",
    items: [
      "Added per-user API key management: each user saves their own OpenAI/Anthropic keys in Settings",
      "Added Projects to organize and group processing runs by campaign or initiative",
      "New Settings page with password-togglable inputs and save to Supabase",
      "New Projects page with expandable cards showing run history, status, and total cost",
      "New Project dialog with name, use case, and optional description",
      "Project selector in Optimize flow: assign runs to a project before processing",
      "Warning banner when no API keys are configured, guiding users to Settings",
      "Removed shared VITE_OPENAI_API_KEY and VITE_ANTHROPIC_API_KEY environment variables",
      "Added Supabase migration for projects, user_settings tables, and runs.project_id column",
      "Row Level Security policies for projects and user settings",
      "Sidebar navigation updated with Projects and Settings tabs",
    ],
  },
  {
    version: "v2.5.0",
    date: "February 17, 2026",
    title: "Partoo Overhaul & Rebranding",
    description:
      "Major Partoo improvements with About field generation, store type filtering, faster file processing, and AI-discoverability-optimized prompts. Project officially renamed to VisionDescribe.",
    items: [
      "Added About field generation for Partoo store locator pages",
      "Added store type filter to process only specific store categories",
      "Replaced ExcelJS with SheetJS for significantly faster XLSX parsing and export",
      "Optimized Partoo prompts for AI discoverability and fuller, richer descriptions",
      "Preserved original Partoo file structure on export, no more missing columns",
      "Added anti-AI-writing-tell instructions for more natural, human-sounding content",
      "Removed opening date from Partoo prompts to reduce noise",
      "Improved store type categorization to handle locator group names",
      "Updated target group descriptions and fixed color translation tables",
      "Amazon table preview improvements",
      "Simplified use case labels and hidden Zalando option",
      "Renamed E-commerce label to E-commerce (triumph.com)",
      "Renamed all references from AI Copy Assistant to VisionDescribe",
    ],
  },
  {
    version: "v2.4.0",
    date: "February 12, 2026",
    title: "Security & Architecture",
    description:
      "Added password protection via HTTP Basic Auth, deduplicated the prompt system into shared modules, and bundled test files for every use case.",
    items: [
      "Added HTTP Basic Auth via Vercel Edge Middleware; the app is now password-protected",
      "Deduplicated prompt architecture with shared modules across all use cases",
      "Updated NEXT size translations with the complete Zeynep Arman list",
      "Added test files for all use cases and HTML rendering in image analysis preview",
      "Refactored internal naming: WatsonAnalyzer renamed to OptimizeMode",
    ],
  },
  {
    version: "v2.3.0",
    date: "February 9, 2026",
    title: "Visual Refinement: Calm Precision Aesthetic",
    description:
      "Full UI restyling inspired by Vercel, Linear, and Cursor: softer contrasts, cool-gray tinting, lighter font weights, more whitespace, and barely-visible borders. Zero functional changes.",
    items: [
      "Cool-gray (220 hue) tinted design tokens across all light and dark mode CSS variables",
      "Softer foreground/background: no pure black or white, reduced eye strain in both themes",
      "Lighter font weights throughout: semibold/bold replaced with medium across all components",
      "Increased whitespace: larger card padding (p-7), main content area (px-8 py-10), drop zones (p-10)",
      "Subtler borders: border-border/30 on cards, border-border/60 on inputs, border-border/40 on header",
      "Reduced shadow intensity: shadow-lg replaced with shadow-sm on dialogs, popovers, and toasts",
      "Lighter overlays: dialog/sheet backdrops reduced from 80% to 50% opacity",
      "Thinner progress bars (h-2), slightly rounder corners (radius 0.625rem), rounded-xl cards",
      "Compact controls: buttons, inputs, selects, and tabs all reduced by one size step",
      "Drop zones softened from double to single border with more padding",
    ],
  },
  {
    version: "v2.2.0",
    date: "February 6, 2026",
    title: "Models & UI Refresh",
    description:
      "Major UI redesign inspired by shadcn/ui, new flagship AI models, and Anthropic prompt caching for significant cost savings.",
    items: [
      "Complete UI redesign: step wizard, card-based layout, clean shadcn tokens",
      "Added GPT-5.2 (OpenAI flagship, $1.75/MTok) and Claude Opus 4.6 (Anthropic flagship)",
      "Implemented Anthropic prompt caching: ~90% savings on cached input tokens",
      "Card-based model selector with speed, cost, and quality badges",
      "Modern activity log panel with color-coded entries and auto-scroll",
      "Full-width drag & drop file upload zone",
      "Processing summary with cost breakdown and export actions in a single card",
      "Step indicator adapts per use case (ecommerce, Amazon, Partoo, AboutYou, NEXT)",
      "Removed deprecated GPT-5 model, replaced with GPT-5.2",
    ],
  },
  {
    version: "v2.1.0",
    date: "September 30, 2025",
    title: "Localization & Quality",
    description:
      "Critical localization improvements separating European Portuguese from Brazilian Portuguese, plus brand tone-of-voice guidelines.",
    items: [
      "Separated PT-PT (Portugal) from PT-BR (Brazil): no more Brazilian terms in European Portuguese",
      "Implemented intelligent localization system (cultural adaptation, not just translation)",
      "Added language-specific instructions for natural, fluent output",
      "Spanish translations now natural and idiomatic",
      "Added brand Tone of Voice guidelines for Triumph and sloggi",
      "Enhanced all language outputs (DE, FR, IT, ES, PT-PT, PT-BR) with cultural adaptation",
    ],
  },
  {
    version: "v2.0.0",
    date: "September 30, 2025",
    title: "Next-Gen AI Models & Marketplace Expansion",
    description:
      "Upgraded to the latest generation of AI models and added support for AboutYou and NEXT marketplace platforms.",
    items: [
      "Upgraded to GPT-5 and Claude Sonnet 4.5 (latest generation models)",
      "Removed deprecated models (o4-mini, o3, Claude Opus 4)",
      "Added AboutYou marketplace support with color translation tables",
      "Added NEXT marketplace support with size EU-to-GB translation",
      "Translator review panel for color and size mappings before processing",
      "Updated cost tracking with official model pricing",
      "Reduced hallucinations with next-gen model grounding",
    ],
  },
  {
    version: "v1.1.0",
    date: "May 15, 2025",
    title: "AI Optimization & Multi-Model Support",
    description:
      "Introduced AI-powered text optimization with support for both OpenAI and Anthropic models, plus real-time cost monitoring.",
    items: [
      "Added text optimization with OpenAI (o4-mini, o3) and Anthropic (Claude Sonnet, Opus)",
      "Unified AnalyzerService for seamless model switching",
      "Real-time API cost monitoring and token tracking",
      "Cost-effective vs high-performance model categorization",
      "Amazon marketplace support with bullet point optimization",
      "Partoo store description generation with multi-language output",
      "Business ID filtering for targeted Partoo processing",
    ],
  },
  {
    version: "v1.0.0",
    date: "May 14, 2025",
    title: "Initial Release",
    description:
      "First release of VisionDescribe: a tool for generating optimized product content from Inriver exports using AI.",
    items: [
      "Multi-format file support (Excel, CSV) with web worker parsing",
      "Automatic column detection and mapping",
      "E-commerce use case with MaterialLongDescriptionEcom optimization",
      "Multi-language content generation",
      "Export to optimized Excel format",
    ],
  },
];

const Changelog: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header standalone />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="mb-2 text-2xl font-medium tracking-tight md:text-3xl">
            Changelog
          </h1>
          <p className="text-sm text-muted-foreground">
            All notable updates and improvements to VisionDescribe.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-12 md:mt-16 md:space-y-16">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="relative flex flex-col gap-3 md:flex-row md:gap-12"
            >
              <div className="top-8 flex h-min w-56 shrink-0 items-center gap-3 md:sticky">
                <Badge variant="secondary" className="text-xs">
                  {entry.version}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  {entry.date}
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="mb-2 text-base leading-tight font-medium text-foreground md:text-lg tracking-tight">
                  {entry.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {entry.description}
                </p>
                {entry.items && entry.items.length > 0 && (
                  <ul className="mt-3 ml-4 space-y-1 text-sm text-muted-foreground">
                    {entry.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
