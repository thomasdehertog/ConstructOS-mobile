import 'dotenv/config'; // must run before anything else

// const dotenv = require('dotenv'); // No longer needed if using import 'dotenv/config'
// const path = require('path'); // No longer needed for this specific debug
// const fs = require('fs'); // No longer needed for this specific debug

// --- Debugging .env file content (Removed to simplify and rely on dotenv/config) ---
// const envPath = path.resolve(process.cwd(), '.env');
// try {
//   const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
//   console.log('[app.config.js] Raw content of .env file found at:', envPath);
//   console.log('-------------------- START .ENV CONTENT --------------------');
//   console.log(envFileContent);
//   console.log('--------------------- END .ENV CONTENT ---------------------');
// } catch (err) {
//   // console.error('[app.config.js] Error directly reading .env file with fs:', err); // Silencing this as it might be confusing if .env.local is used
// }
// --- End .env content debugging ---

// const result = dotenv.config({ path: envPath }); // No longer needed if using import 'dotenv/config'

// if (result.error) { // No longer needed
//   console.error('[app.config.js] Error loading .env file with dotenv:', result.error);
// } else {
//   // Log what dotenv itself parsed
//   console.log('[app.config.js] dotenv.config() parsed content:', result.parsed);
// }

// --- Debugging process.env after dotenv/config import ---
console.log("app.config.js: Attempting to load .env files using 'dotenv/config'...");
console.log("🔍 Loaded EXPO_PUBLIC_TEST_VARIABLE:", process.env.EXPO_PUBLIC_TEST_VARIABLE);
console.log("[app.config.js] After 'dotenv/config', EXPO_PUBLIC_GOOGLE_STT_API_KEY:", process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY);
console.log("[app.config.js] After 'dotenv/config', EXPO_PUBLIC_WHISPER_API_KEY:", process.env.EXPO_PUBLIC_WHISPER_API_KEY);
// --- End Debugging ---

export default ({ config }) => {
  const baseConfig = {
    name: "my-app",
    slug: "constructos", // Ensure slug matches expo.dev slug
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: "This app uses the microphone to record audio notes for your projects."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to allow you to attach them to your reports.",
          "cameraPermission": "The app accesses your camera to allow you to take photos for your reports.",
          "microphonePermission": "The app accesses your microphone to allow you to record audio for your reports (if applicable)."
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for recording notes."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  };

  return {
    ...config,
    ...baseConfig,
    extra: {
      ...(config.extra || {}), // Preserve existing extra fields
      googleSttApiKey: process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY,
      testVariable: process.env.EXPO_PUBLIC_TEST_VARIABLE,
      whisperApiKey: process.env.EXPO_PUBLIC_WHISPER_API_KEY,
      eas: {
        ...(config?.extra?.eas || {}), // Preserve existing eas fields
        projectId: "1df2c15c-d656-41f3-8098-32b9ca063756"
      }
    },
  };
}; 