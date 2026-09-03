# KGPOS — Cross-Platform Point of Sale

A modern Point of Sale (POS) application built with **Electron + React + SQLite**, designed for small and medium businesses. Runs on **Windows, macOS, and Linux**.

## Features

- **Product management** — add, edit, delete products with barcode, category, price, cost, and stock tracking (with low-stock alerts)
- **User / employee management** — role-based accounts (admin, manager, cashier) with secure password hashing
- **Sales / checkout** — fast cart-based checkout with product search & barcode scanning, cash/card/mobile payment, and change calculation
- **Sales history & reporting** — browse past transactions, filter by date, and export to CSV
- **Receipt printing** — print receipts for completed sales
- **Dashboard** — today's revenue, sales count, low-stock and recent transactions at a glance
- **Local SQLite database** — no server required, data stays on the business's own machine

## Default Login

| Username | Password |
|----------|----------|
| `admin`  | `admin`  |

Change the admin password after your first login.

## Tech Stack

- **Electron** — cross-platform desktop shell
- **React + Vite** — fast, modern UI
- **better-sqlite3** — lightweight embedded database
- **bcryptjs** — secure password hashing
- **electron-builder** — packaging for Windows (NSIS), macOS (DMG), and Linux (AppImage/deb)

## Development

```bash
npm install
npm run rebuild    # compile native better-sqlite3 for Electron
npm run dev        # launch with Vite dev server + Electron
```

## Production Build

```bash
npm run dist:win   # Windows installer  (.exe)
npm run dist:mac   # macOS disk image   (.dmg)
npm run dist:linux # Linux AppImage + deb
```

Output is written to the `release/` directory.

## Data Storage

All data (products, users, sales) is stored in a local SQLite database in the operating system's per-user application data directory:
- Windows: `%APPDATA%/kgpos/db/kgpos.db`
- macOS: `~/Library/Application Support/kgpos/db/kgpos.db`
- Linux: `~/.config/kgpos/db/kgpos.db`

## License

MIT
