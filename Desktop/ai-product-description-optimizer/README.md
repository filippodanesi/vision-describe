# AI Product Description Optimizer

Professional AI-powered optimization tool for Triumph and Sloggi ecommerce product descriptions using InRiver export data.

## Purpose

Streamlines product content enhancement for Triumph International's ecommerce operations by processing [InRiver](https://www.inriver.com/) exports and optimizing product descriptions with advanced AI models while maintaining brand consistency and cost control.

## Core Capabilities

- **InRiver Integration** - Process Excel and CSV exports from InRiver PIM system
- **AI-Powered Optimization** - Enhance ColorMaterialLongDescriptionEcom fields using state-of-the-art language models
- **Multi-language Processing** - Support for all European market languages with automatic detection
- **Batch Operations** - Efficient processing of large product catalogs with comprehensive cost tracking
- **Secure Architecture** - Client-side processing ensures data privacy and security

## Workflow

### Data Preparation
Export product data from InRiver containing:
- ```ColorMaterialLongDescriptionEcom``` columns (optimization targets)
- ```Short Description``` columns (keyword sources)
- ```ColorSAPMaterialNo``` (product identification)

### Configuration
- Configure API credentials for chosen AI provider
- Select appropriate model based on quality and cost requirements
- Set processing limits and budget constraints

### Processing
1. Upload InRiver export file
2. Map columns for optimization and keyword extraction
3. Configure batch processing parameters
4. Execute optimization with real-time cost monitoring
5. Export enhanced descriptions in original format

## Supported AI Models

### OpenAI
- ```o3``` - Latest generation model for premium quality optimization
- ```o4-mini``` - Cost-effective option for high-volume processing

### Anthropic
- ```Claude Opus 4``` - Most intelligent generation model for premium quality optimization
- ```Claude Sonnet 4``` - Advanced reasoning and creative optimization capabilities

## Technical Specifications

- **Framework** - React with TypeScript
- **UI Components** - Shadcn/ui with Tailwind CSS
- **File Processing** - ExcelJS and PapaParse for secure data handling
- **Security** - Client-side processing, no server-side data storage
- **Export Formats** - Excel (.xlsx) and CSV with InRiver compatibility

## Cost Management

- Real-time cost estimation and tracking
- Configurable budget limits per processing session
- Detailed cost breakdown by product and model
- Historical session reporting for budget planning

## System Requirements

- Modern web browser with JavaScript enabled
- Active API account with OpenAI or Anthropic
- InRiver export files in supported formats

## Data Security

All processing occurs client-side with no server-side data storage. API credentials are stored only in browser session storage and automatically cleared on browser close. Direct encrypted connections to AI providers ensure data privacy.

## License

This project is dual-licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license for personal and educational use. Commercial use requires a separate license from Triumph Intertrade AG.

Commercial licensing covers any revenue-generating use, commercial products, or business services. Contact Triumph Intertrade AG for commercial licensing inquiries.

## Copyright

Copyright (c) 2025 Triumph Intertrade AG. All rights reserved.

This software contains proprietary technology developed for Triumph International's ecommerce optimization workflows.
