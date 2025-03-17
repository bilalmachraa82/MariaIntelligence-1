
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mariafaz.app',
  appName: 'Maria Faz',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
