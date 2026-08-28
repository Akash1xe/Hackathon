const errors = [];
const warnings = [];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} is required.`);
  return value || '';
}

const mongoUri = required('MONGODB_URI');
const authSecret = required('NEXTAUTH_SECRET');
const cloudName = required('CLOUDINARY_CLOUD_NAME');
const cloudinaryKey = required('CLOUDINARY_API_KEY');
const cloudinarySecret = required('CLOUDINARY_API_SECRET');
const deploymentUrl = process.env.NEXTAUTH_URL?.trim()
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

if (mongoUri && !/^mongodb(\+srv)?:\/\//i.test(mongoUri)) errors.push('MONGODB_URI must be a MongoDB connection string.');
if (/username:password|cluster\.example/i.test(mongoUri)) errors.push('MONGODB_URI still contains example credentials.');
if (authSecret && (authSecret.length < 32 || /replace-with/i.test(authSecret))) errors.push('NEXTAUTH_SECRET must be a real random secret of at least 32 characters.');
if (!deploymentUrl) errors.push('Set NEXTAUTH_URL or expose Vercel system environment variables.');
if (deploymentUrl && !/^https:\/\//i.test(deploymentUrl) && process.env.VERCEL) errors.push('The production authentication URL must use HTTPS.');
if ([cloudName, cloudinaryKey, cloudinarySecret].filter(Boolean).length > 0 && [cloudName, cloudinaryKey, cloudinarySecret].some((value) => !value)) errors.push('All three CLOUDINARY_* variables must be configured together.');
if (!process.env.HF_TOKEN?.trim()) warnings.push('HF_TOKEN is not configured; evidence AI will use the human-review fallback.');
if (!process.env.OPENCAGE_API_KEY?.trim()) warnings.push('OPENCAGE_API_KEY is not configured; coordinates will be used when reverse geocoding is unavailable.');

for (const warning of warnings) console.warn(`Warning: ${warning}`);
if (errors.length) {
  console.error('Production configuration is incomplete:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Production environment validation passed.');
