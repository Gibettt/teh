# Tea Traceability

Aplikasi ini sudah disatukan menjadi satu folder dan satu package. Untuk development, frontend berjalan langsung dengan Vite supaya HMR aktif dan halaman tidak perlu reload manual. Backend Express tetap tersedia di package yang sama.

## Fitur

- dashboard paper-style yang responsif
- tombol **Connect Wallet** di topbar setelah login
- integrasi **wagmi + RainbowKit** untuk wallet browser dan mobile wallet flow
- batch memakai **dynamic multi-path** tanpa dropdown alur
- tahap opsional bisa **di-skip dari awal proses**
- complete/skip ditampung dulu di Supabase
- saat batch final, seluruh tahap digabung menjadi satu JSON Pinata
- CID final saja yang dikirim ke smart contract Sepolia lewat transaksi manual MetaMask

## Env

Copy `.env.example` ke `.env`.

```env
PORT=5000
SUPABASE_PROJECT_REF=pscobituhjquyrjpyhgx
SUPABASE_URL=https://pscobituhjquyrjpyhgx.supabase.co
SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=https://pscobituhjquyrjpyhgx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=/api
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_WALLETCONNECT_PROJECT_ID=
VITE_CONTRACT_ADDRESS=
JWT_SECRET=super-secret-key
PINATA_JWT=
PINATA_GATEWAY=
CONTRACT_ADDRESS=
BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
```

Isi `VITE_WALLETCONNECT_PROJECT_ID` agar flow WalletConnect/QR untuk mobile wallet aktif penuh.
Isi `CONTRACT_ADDRESS` dan `VITE_CONTRACT_ADDRESS` dengan kontrak yang memiliki fungsi `storeIpfsCid(string ipfsCid)`. Tidak ada `PRIVATE_KEY`; transaksi Sepolia harus dikonfirmasi manual dari MetaMask owner kontrak.

## Supabase

Link project:

```bash
supabase login
supabase link --project-ref pscobituhjquyrjpyhgx
```

Push schema:

```bash
supabase db push
```

Backend memakai publishable key juga. Karena itu migrasi membuat policy `anon` untuk read/write tabel aplikasi.

Setelah schema sudah dipush, import data JSON lama:

```bash
npm run supabase:import
```

## Jalankan

```bash
npm install
npm run dev
```

Browser akan terbuka otomatis dari Vite, biasanya di `http://localhost:5173`.

Kalau butuh login, data batch, atau upload JSON final ke Pinata, jalankan API di terminal kedua:

```bash
npm run api
```

Frontend tetap memakai `/api` dan Vite akan meneruskannya ke `http://localhost:5000`.

Kalau ingin menjalankan frontend dan backend dari satu server seperti production:

```bash
npm run dev:server
```

## Production

```bash
npm run build
npm start
```
