import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soulroom.app',
  appName: 'Soul Room',
  webDir: 'out',
  appendUserAgent: 'Capacitor',
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#160824',
      showSpinner: true,
      spinnerColor: '#FF4B6E',
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
