const path = require('path');
const dotenv = require('dotenv');
const fs =require('fs');

console.log('--- Standalone dotenv Test Script ---');

const envPath = path.resolve(process.cwd(), '.env');

console.log('Attempting to read .env from path:', envPath);

try {
  const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
  console.log('Raw content of .env file read by fs:');
  console.log('-------------------- START .ENV CONTENT --------------------');
  console.log(envFileContent);
  console.log('--------------------- END .ENV CONTENT ---------------------\n');
} catch (err) {
  console.error('Error directly reading .env file with fs:', err);
}

const result = dotenv.config({ path: envPath, debug: true }); // Enable dotenv debug mode

console.log('\n--- dotenv.config() Results ---');
if (result.error) {
  console.error('Error loading .env file with dotenv:', result.error);
} else {
  console.log('dotenv.config() parsed content:', result.parsed);
}

console.log('\n--- process.env Values After dotenv.config() ---');
console.log('process.env.EXPO_PUBLIC_TEST_VARIABLE:', process.env.EXPO_PUBLIC_TEST_VARIABLE);
console.log('process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY:', process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY);
console.log('process.env.CONVEX_DEPLOYMENT:', process.env.CONVEX_DEPLOYMENT);
console.log('process.env.EXPO_PUBLIC_CONVEX_URL:', process.env.EXPO_PUBLIC_CONVEX_URL);

console.log('\n--- End of Standalone dotenv Test Script ---'); 