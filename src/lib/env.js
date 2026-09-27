import "server-only";

export function requireEnv(...keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}
