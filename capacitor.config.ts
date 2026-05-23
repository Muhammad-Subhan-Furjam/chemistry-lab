import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labinnovations.suite',
  appName: 'ChemTrack',
  webDir: 'dist/client',
  bundledWebRuntime: false,
  server: {
    url: 'https://lab-innovations-suite.vercel.app',
    cleartext: false
  }
};

export default config;