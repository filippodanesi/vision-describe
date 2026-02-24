/**
 * POST /api/process-run-chain
 *
 * Mirror of /api/process-run used for self-chaining.
 * Vercel returns 508 (Loop Detected) when a function calls itself
 * repeatedly via the same path. By alternating between two endpoints,
 * we break the loop detection while running the same handler logic.
 */
export { default, config } from './process-run';
