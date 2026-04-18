# Saham Print

Saham Print is a local-only desktop app for managing print shop orders, customers, services, payments, invoices, reports, and backups.

The app is built with React, Vite, Tauri, Rust, and SQLite. It is designed to be usable offline after installation. Persistent app data is stored in the local SQLite database, not browser storage.

## Current Scope

- Local desktop app through Tauri.
- Local SQLite database through Rust and `rusqlite`.
- Offline UI assets with no Google Fonts or remote preview image dependency.
- Orders, customers, services, payments, account settings, and backup/restore use SQLite.
- JSON backup export/import from the app.
- macOS app bundle build verified locally.

## Requirements

- Node.js or Bun-compatible JavaScript runtime.
- Project dependencies installed in `node_modules`.
- Rust toolchain with Cargo.
- Tauri platform prerequisites for the OS you are building on.

For macOS packaging, Xcode Command Line Tools are also expected.

For Windows packaging, build on Windows with the Rust toolchain and the NSIS bundler support required by Tauri.

## Install Dependencies

```sh
npm install
```

This repo currently has no tracked JavaScript package-manager lockfile. Do not delete `src-tauri/Cargo.lock`; it is tracked and should stay in the repo for reproducible Rust builds.

## Run For Development

Web-only dev server:

```sh
npm run dev
```

Desktop dev app:

```sh
npm run desktop:dev
```

The desktop dev app uses the Vite dev server configured in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).

## Build

Production web build:

```sh
npm run build
```

macOS app bundle:

```sh
bun run desktop:build:mac
```

Output:

```text
src-tauri/target/release/bundle/macos/Saham Print.app
```

Full Tauri build for the current OS:

```sh
bun run desktop:build
```

Windows NSIS build, run from Windows:

```sh
bun run desktop:build:win
```

Windows output should be under:

```text
src-tauri/target/release/bundle/
```

## Installing A Rebuilt macOS App

Building creates a new app bundle in the repo, but it does not automatically replace an app already installed in `/Applications`.

After rebuilding:

1. Quit the installed Saham Print app.
2. Replace the existing `/Applications/Saham Print.app` with:

```text
src-tauri/target/release/bundle/macos/Saham Print.app
```

3. Open the installed app again.

## Default Login

Fresh databases use:

```text
username: admin
password: admin123
```

Account settings are stored in SQLite. Changing the username or password persists after quitting and reopening the desktop app.

## Database

The app stores data in:

```text
saham-print.sqlite3
```

Tauri places this file in the platform app data directory for the app identifier:

```text
com.saham.print
```

Typical locations:

```text
macOS:   ~/Library/Application Support/com.saham.print/saham-print.sqlite3
Windows: %APPDATA%\com.saham.print\saham-print.sqlite3
Linux:   ~/.local/share/com.saham.print/saham-print.sqlite3
```

The app's database status command returns the exact path used on the current machine.

## Backup And Restore

Use the Backup page in the app.

Export creates a JSON backup containing:

- settings, except the active login session
- customers
- services
- orders
- payments

Import validates the backup, replaces the local database content transactionally, resets the next order number if needed, and logs the app out after restore.

## Verification Commands

Run these before handing off a build:

```sh
CARGO_NET_OFFLINE=true cargo check --manifest-path src-tauri/Cargo.toml
CARGO_NET_OFFLINE=true cargo test --manifest-path src-tauri/Cargo.toml
npx tsc --noEmit
npm run build
npm run test
npm run lint
```

For macOS release handoff:

```sh
bun run desktop:build:mac
```

For Windows release handoff, run on Windows:

```sh
bun run desktop:build:win
```
