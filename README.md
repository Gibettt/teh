# Tea Traceability Starter

Versi ini sudah diperbarui dengan:

- dashboard paper-style yang lebih modern dan responsif
- tombol **Connect Wallet** di topbar setelah login
- integrasi **wagmi + RainbowKit** untuk kompatibilitas wallet browser dan mobile wallet flow
- batch tetap memakai **dynamic multi-path** tanpa dropdown alur
- tahap opsional bisa **di-skip dari awal proses**
- complete/skip tetap otomatis:
  - simpan JSON ke Pinata
  - ambil CID
  - kirim CID ke smart contract di Sepolia

## Frontend env

Copy `frontend/.env.example` ke `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_WALLETCONNECT_PROJECT_ID=
```

Isi `VITE_WALLETCONNECT_PROJECT_ID` agar flow WalletConnect/QR untuk mobile wallet aktif penuh.

## Backend env

Copy `backend/.env.example` ke `backend/.env`

```env
PORT=5000
JWT_SECRET=super-secret-key
PINATA_JWT=
PINATA_GATEWAY=
RPC_URL=
PRIVATE_KEY=
CONTRACT_ADDRESS=
BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
```

## Jalankan

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
