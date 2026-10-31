/**
 * Utility functions for numeric, currency, and score formatting.
 */

/**
 * Format score to maximum 1 decimal place without unnecessary trailing zeros.
 * Examples:
 *  - 7.000000000000001 -> "7"
 *  - 3.0100000000000002 -> "3"
 *  - 8.5 -> "8.5"
 *  - 6.333333333333333 -> "6.3"
 *  - 10 -> "10"
 *  - 0 -> "0"
 */
export const formatScore = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '0';
  const rounded = Math.round((num + Number.EPSILON) * 10) / 10;
  return String(rounded);
};
