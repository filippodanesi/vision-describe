/**
 * Series name formatting rules.
 * Ensures consistent series-name cleanup across all use cases.
 */

export function seriesNameRules(): string {
  return `SERIES NAME FORMATTING:
- ALWAYS remove the "O-" or "O -" prefix from series names
  • Wrong: "O - Light Paonette" or "O-Velveteen Sensation"
  • Correct: "Light Paonette" or "Velveteen Sensation"
- For series ending in "T" (e.g., "Ladyform Soft T"), use the name without "T"
  • Wrong: "Ladyform Soft T"
  • Correct: "Ladyform Soft"
- ALWAYS refer to series as "the [Series Name] series" for clarity
  • Wrong: "Light Paonette offers..."
  • Correct: "The Light Paonette series offers..."`;
}
