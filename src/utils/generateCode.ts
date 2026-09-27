/**
 * Generates a sequential-looking, human-readable request code.
 * In production, replace the random suffix with a real DB sequence/counter
 * per prefix+year so codes are guaranteed sequential and unique.
 */
export function generateCode(prefix: string): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}-${suffix}`;
}
