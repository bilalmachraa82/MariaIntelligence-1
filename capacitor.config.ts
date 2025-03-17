
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mariafaz.app',
  appName: 'Maria Faz',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    hostname: 'app',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'key0',
      keystorePassword: 'maria123',
      keyPassword: 'maria123'
    },
    backgroundColor: "#ffffff",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
