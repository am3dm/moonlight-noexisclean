import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noexis.pos', // تم تحديث المعرف ليكون احترافياً
  appName: 'نظام إدارة المتجر',
  webDir: 'dist',
  
  // هام للإنتاج: تم إزالة قسم server.url لكي يعمل التطبيق من الملفات المحلية (Offline)
  // هذا يضمن سرعة عالية وعمل التطبيق حتى بدون إنترنت
  server: {
    androidScheme: 'https', // يحسن التوافقية والأمان
    cleartext: true 
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#3b82f6',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body', // يمنع تشوه التصميم عند ظهور الكيبورد
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  
  // إعدادات إضافية لنظام أندرويد
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // تعطيل التصحيح في الإنتاج للأمان
  }
};

export default config;
