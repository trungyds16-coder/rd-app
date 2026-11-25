const fs = require('fs');
const path = require('path');

const srcRes = path.join(__dirname, '..', 'res');
const srcAssets = path.join(__dirname, '..', 'assets');
const mainRes = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

if (fs.existsSync(srcRes) && fs.existsSync(mainRes)) {
  console.log('Applying custom Sapphire Blue & Smooth White Flask app icons...');

  // 1. Copy mipmap PNGs (legacy ic_launcher, ic_launcher_round, and 108dp ic_launcher_foreground)
  const folders = fs.readdirSync(srcRes);
  for (const folder of folders) {
    const srcFolder = path.join(srcRes, folder);
    const destFolder = path.join(mainRes, folder);
    if (fs.statSync(srcFolder).isDirectory()) {
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      const files = fs.readdirSync(srcFolder);
      for (const file of files) {
        fs.copyFileSync(path.join(srcFolder, file), path.join(destFolder, file));
        console.log(`  Copied ${folder}/${file}`);
      }
    }
  }

  // 2. Remove Capacitor's default white/template foreground vector XMLs if present so @mipmap/ic_launcher_foreground is used cleanly
  for (const rel of [
    'drawable/ic_launcher_foreground.xml',
    'drawable-v24/ic_launcher_foreground.xml',
    'drawable/ic_launcher_background.xml',
    'mipmap-anydpi-v33/ic_launcher.xml',
    'mipmap-anydpi-v33/ic_launcher_round.xml'
  ]) {
    const p = path.join(mainRes, rel);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  Removed default template file: ${rel}`);
    }
  }

  // 3. Create smooth Sapphire Blue gradient background drawable
  const drawableDir = path.join(mainRes, 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  const bgDrawableXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient
        android:type="linear"
        android:angle="315"
        android:startColor="#2674DC"
        android:centerColor="#1558B0"
        android:endColor="#0C3F86" />
</shape>
`;
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), bgDrawableXml, 'utf8');

  // Also copy splash.png if present
  const splashSrc = path.join(srcAssets, 'splash.png');
  if (fs.existsSync(splashSrc)) {
    fs.copyFileSync(splashSrc, path.join(drawableDir, 'splash.png'));
    console.log('  Copied drawable/splash.png');
  }

  // 4. Override @color/ic_launcher_background to #1558B0 in values/
  const valuesDir = path.join(mainRes, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1558B0</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgColorXml, 'utf8');

  // 5. Write mipmap-anydpi-v26 adaptive icon XMLs pointing directly to blue gradient background + smooth white flask foreground
  const anydpiDir = path.join(mainRes, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');
  console.log('[OK] Configured mipmap-anydpi-v26 adaptive icons (Sapphire Blue bg + Smooth White Flask fg)!');

  // 6. Configure clean status bar appearance in values/styles.xml
  const stylesPath = path.join(valuesDir, 'styles.xml');
  if (fs.existsSync(stylesPath)) {
    let xml = fs.readFileSync(stylesPath, 'utf8');
    if (!xml.includes('windowLightStatusBar')) {
      xml = xml.replace(
        /<style name="AppTheme\.NoActionBar"[^>]*>/,
        m => `${m}\n        <item name="android:statusBarColor">#F0F4F9</item>\n        <item name="android:windowBackground">#F0F4F9</item>\n        <item name="android:windowLightStatusBar">true</item>`
      );
      fs.writeFileSync(stylesPath, xml, 'utf8');
      console.log('[OK] Patched styles.xml for light status bar & edge-to-edge margins.');
    }
  }

  // 7. Set Android APK versionCode & versionName to 5.0.2.0
  const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  if (fs.existsSync(gradlePath)) {
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 5020');
    gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "5.0.2.0"');
    fs.writeFileSync(gradlePath, gradle, 'utf8');
    console.log('[OK] Updated Android build.gradle versionCode=5020, versionName="5.0.2.0".');
  }
} else {
  console.log('Skipping icon/style patch: android directory not found yet.');
}