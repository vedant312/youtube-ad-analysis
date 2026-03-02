# YouTube Ad Analysis Extension 📊 (WXT Framework)

A modern, high-performance browser extension built with the **WXT framework** to monitor and analyze advertisement data on YouTube. This project leverages Vite-based bundling and Manifest V3 to provide real-time insights into digital ad consumption.

---

## 🚀 Overview

This extension monitors the YouTube video player to capture and analyze ad delivery. By using WXT, the project benefits from a structured development environment, optimized builds, and seamless multi-browser support.

## ✨ Key Features

- **WXT Powered:** Built with the WXT framework for optimized bundling and a modern developer experience.
- **Real-time Mutation Tracking:** Uses `MutationObserver` within WXT entrypoints to detect ad injections.
- **Ad Metadata Extraction:** Scrapes ad duration, advertiser identity, and skip-status.
- **Session Analytics:** Tracks "Ad-to-Content" ratios and persists data using `storage`.
- **Auto-Reloading:** Fast development cycle thanks to WXT's integrated dev server.

## 🛠️ Tech Stack

- **Framework:** [WXT (Web Extension Toolbox)](https://wxt.dev/)
- **Bundler:** Vite
- **Language:** JavaScript / TypeScript (ES6+)
- **Platform:** Manifest V3

## 📂 Project Structure (WXT Standard)

```text
├── assets/             # Static assets like icons
├── entrypoints/        # WXT Entrypoints (The heart of the extension)
│   ├── content.ts      # Logic that runs on YouTube pages
│   ├── popup/          # Dashboard UI (HTML/CSS/JS)
│   └── background.ts   # Service worker for API & Storage
│   └── youtube.content # Script to extract ad ID
├── wxt.config.ts       # WXT Configuration
└── package.json        # Dependencies and scripts
```
