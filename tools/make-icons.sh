#!/bin/sh
# Regenerates the raster brand assets from the SVG sources using headless Chrome.
# Rasters are only needed where SVG is not accepted: PWA icons, Apple touch icon,
# and og:image (Twitter/Slack/WhatsApp all refuse SVG previews).
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found. Set CHROME=/path/to/chrome"; exit 1; }

shot() { # shot <html-or-svg> <size> <out>
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --screenshot="$3" --window-size="$2" "file://$PWD/$1" >/dev/null 2>&1
}

# PWA + Apple icons: wrap the SVG so it fills the viewport exactly.
for spec in "192,192 assets/icon-192.png assets/favicon.svg" \
            "512,512 assets/icon-512.png assets/favicon.svg" \
            "512,512 assets/icon-maskable-512.png assets/logo-maskable.svg" \
            "180,180 assets/apple-touch-icon.png assets/favicon.svg"; do
  set -- $spec
  cat > /tmp/nought-icon.html <<EOF
<style>html,body{margin:0;padding:0;background:transparent}
img{display:block;width:100vw;height:100vh}</style>
<img src="file://$PWD/$3">
EOF
  cp /tmp/nought-icon.html tools/.icon.tmp.html
  shot tools/.icon.tmp.html "$1" "$2"
  echo "  $2"
done
rm -f tools/.icon.tmp.html

shot tools/og.html 1200,630 assets/og.png
echo "  assets/og.png"
