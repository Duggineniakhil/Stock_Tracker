/**
 * Normalize a purchase date to YYYY-MM-DD.
 * Validation converts dates to Date objects, which sqlite would otherwise
 * persist as epoch milliseconds; older rows may already be stored that way.
 */
export const toDateOnly = (value: unknown): unknown => {
    if (value === null || value === undefined || value === '') return value;
    const date = value instanceof Date ? value : new Date(value as string | number);
    return isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};
