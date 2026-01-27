export function getEnv(key: string): string {
  const value = process.env[key];
  console.log('VALUE', value);
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}
