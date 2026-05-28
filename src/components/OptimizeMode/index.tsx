/**
 * OptimizeMode barrel.
 *
 * The legacy <VisionDescribe /> default export (standalone shell with its own
 * Header/Footer/ThemeProvider) has been superseded by <OptimizeMode />, which
 * lives in ./OptimizeMode.tsx and renders inside the shared AppShell. Only the
 * named re-export below is consumed (src/components/AppShell/index.tsx).
 */

export { OptimizeMode } from './OptimizeMode';
