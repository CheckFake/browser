#!/usr/bin/env bash

rm -rf fake_news_detector.zip
npm run production
zip -r fake_news_detector.zip background_scripts icons/logo.svg icons/logo@2x.png icons/logo_dev.svg libs images popup/libs popup/stats.css popup/stats.html popup/dist manifest.json