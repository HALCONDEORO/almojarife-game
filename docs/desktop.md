# Desktop app (Windows, macOS, Linux)

The game is a static web app; the desktop build wraps it in a small Electron
shell (`desktop/`) that serves the same files over a loopback-only local
server (ES modules and `fetch()` do not work over `file://`). No account, no
network use beyond the loopback server; saves live in the OS user profile.

## Run it locally

```sh
cd desktop
npm ci
npm start
```

`npm start` first syncs the game files from the repository root into
`desktop/app/` (`sync.mjs`), so the desktop build always runs what the
browser version runs.

## Build the packages

```sh
cd desktop
npm run dist        # unsigned packages for the current OS into desktop/dist/
```

Every push of a `v*` tag, or a manual run of the **Desktop builds** workflow,
builds on GitHub Actions (free for this public repo):

- Windows: NSIS installer + portable `.exe`
- macOS: `.dmg` + `.zip`
- Linux: `.AppImage` + `.deb`

Artifacts are unsigned. What that means per platform, and what fixing it
costs (no spending is authorised):

- **Windows**: SmartScreen warns on new unsigned apps. Options: distribute
  through the Microsoft Store (Store re-signs, free; developer account
  ~19 USD one-time), Azure Artifact Signing (~9.99 USD/month, EU orgs
  eligible), or an OV certificate (150-300 USD/year). Source:
  learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options
- **macOS**: Gatekeeper blocks unsigned apps until the user right-clicks >
  Open. Proper distribution needs the Apple Developer Program (99 USD/year)
  for a Developer ID certificate plus notarization. Source:
  developer.apple.com/programs/whats-included
- **Linux**: no signing culture; AppImage/deb work as-is. 0 cost.

## Why Electron and not Tauri/NW.js

- **Electron** bundles Chromium: identical rendering on the three systems,
  which matters for a Canvas/WebGL-heavy game; mature free tooling
  (electron-builder) and CI. Cost: size (installed ~200 MB, installer
  ~70-100 MB).
- **Tauri** uses the OS webview: tiny installers (~3-10 MB) but rendering
  varies (WebKitGTK on Linux is the risky one for WebGL) and it adds a Rust
  toolchain to every contributor's machine. Kept as a later slim option.
- **NW.js** offers nothing over Electron here and has a smaller ecosystem.
- A **PWA** (install from the browser) costs nothing and can complement the
  installers later, but it is not the .exe/.dmg/AppImage download people
  expect at launch.

Electron and electron-builder are MIT-licensed; the wrapped game keeps its
own MIT/CC BY licences and its CREDITS.md.
