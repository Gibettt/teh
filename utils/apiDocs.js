const STAGE_FIELD_TEMPLATES = {
  plucking: {
    operatorShift: "",
    leafGrade: "",
    weightKg: "",
    location: "",
    notes: "",
  },
  withering: {
    durationMinutes: "",
    temperature: "",
    humidity: "",
    weightBeforeKg: "",
    weightAfterKg: "",
    notes: "",
  },
  rolling: {
    durationMinutes: "",
    machineCode: "",
    rpm: "",
    outputKg: "",
    notes: "",
  },
  predrying: {
    temperature: "",
    durationMinutes: "",
    moisturePercent: "",
    notes: "",
  },
  drying: {
    dryerMachine: "",
    temperature: "",
    durationMinutes: "",
    finalMoisturePercent: "",
    notes: "",
  },
  postdrying: {
    sortingGrade: "",
    qcStatus: "",
    aromaNote: "",
    notes: "",
  },
  packing: {
    packageType: "",
    totalPackage: "",
    netWeightKg: "",
    warehouseLocation: "",
    notes: "",
  },
};

const TEA_PRODUCTION_FLOWS = [
  {
    teaType: "Green Tea",
    stages: ["plucking", "withering", "rolling", "drying", "packing"],
    labels: ["Plucking", "Withering", "Rolling", "Drying", "Packing"],
  },
  {
    teaType: "Yellow Tea",
    stages: ["plucking", "withering", "rolling", "predrying", "drying", "postdrying", "packing"],
    labels: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "White Tea",
    stages: ["plucking", "withering", "drying", "packing"],
    labels: ["Plucking", "Withering", "Drying", "Packing"],
  },
  {
    teaType: "Oolong Tea",
    stages: ["plucking", "withering", "rolling", "predrying", "drying", "postdrying", "packing"],
    labels: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "Black Tea",
    stages: ["plucking", "withering", "rolling", "predrying", "drying", "postdrying", "packing"],
    labels: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "Dark Tea",
    stages: ["plucking", "withering", "rolling", "predrying", "drying", "postdrying", "packing"],
    labels: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
];

const BATCH_MODEL = {
  id: "uuid",
  batchCode: "TEA-2026-0001",
  teaType: "Black Tea",
  gardenBlock: "Block A-07",
  harvestDate: "2026-05-21T08:00",
  notes: "Catatan awal batch",
  workflowMode: "dynamic-multi-path",
  status: "draft | in_progress | completed",
  createdAt: "2026-05-21T08:00:00.000Z",
  createdBy: "Admin Tea Factory",
  trace: {
    batchRegistration: {
      status: "stored_supabase",
      historyId: "uuid",
    },
    finalTrace: {
      status: "pending_ipfs | ipfs_stored | failed",
      ipfsCid: "Qm...",
      ipfsUrl: "https://gateway/ipfs/Qm...",
    },
    blockchainFinalization: {
      status: "awaiting_wallet_signature | anchored",
      finalCid: "Qm...",
      txHash: "0x...",
      txUrl: "https://sepolia.etherscan.io/tx/0x...",
    },
  },
  stages: [
    {
      stageName: "plucking",
      label: "Plucking",
      skippable: false,
      prerequisiteStages: [],
      status: "available | pending | completed | skipped",
      completed: false,
      skipped: false,
      skipReason: null,
      timestamp: null,
      operator: null,
      payload: null,
      historyId: null,
    },
  ],
};

export const API_DOCS = {
  title: "Tea Traceability API",
  version: "1.1.0",
  basePath: "/api",
  contentType: "application/json",
  docsPasswordOnly:
    "API_DOCS_PASSWORD hanya melindungi halaman dokumentasi di web dashboard. Password ini tidak dipakai mobile app.",
  mobileAccess:
    "Mobile app memakai endpoint yang sama dengan web. Endpoint public tidak butuh token, endpoint operasional batch memakai Bearer JWT dari login.",
  mobileBaseUrl:
    "Development: http://<IP-laptop>:5175/api atau port Vite yang aktif. Production: https://<domain-produksi>/api.",
  auth: {
    type: "Bearer JWT",
    header: "Authorization: Bearer <token>",
    tokenSource: "POST /api/auth/login",
    tokenExpiry: "8 jam",
    note: "Simpan token di secure storage mobile. Kirim header Authorization untuk endpoint dengan access Bearer JWT.",
  },
  mobileFlow: [
    {
      order: 1,
      title: "Login operator/admin",
      endpoint: "POST /api/auth/login",
      result: "Simpan token dan data user.",
    },
    {
      order: 2,
      title: "Ambil daftar batch",
      endpoint: "GET /api/batches",
      result: "Tampilkan list batch produksi dan statusnya.",
    },
    {
      order: 3,
      title: "Buat batch baru",
      endpoint: "POST /api/batches",
      result: "Backend membuat batch dengan stage awal plucking berstatus available.",
    },
    {
      order: 4,
      title: "Buka detail batch",
      endpoint: "GET /api/batches/:id",
      result: "Mobile membaca stages. Tombol input muncul untuk stage dengan status available.",
    },
    {
      order: 5,
      title: "Input tahap aktif",
      endpoint: "POST /api/batches/:id/stages/:stageName",
      result: "Backend menyimpan payload tahap, refresh stage berikutnya, dan mengembalikan batch terbaru.",
    },
    {
      order: 6,
      title: "Skip tahap opsional bila diperlukan",
      endpoint: "POST /api/batches/:id/stages/:stageName/skip",
      result: "Hanya rolling dan postdrying yang boleh di-skip. Backend refresh stage berikutnya.",
    },
    {
      order: 7,
      title: "Ulangi sampai semua tahap finalized",
      endpoint: "GET /api/batches/:id",
      result: "Jika semua tahap completed/skipped, backend membuat final JSON ke Pinata otomatis.",
    },
    {
      order: 8,
      title: "Tampilkan traceability",
      endpoint: "GET /api/batches/:id/traceability atau GET /api/batches/public/:id/traceability",
      result: "Gunakan endpoint public untuk halaman QR/publik, endpoint internal untuk dashboard/mobile operator.",
    },
    {
      order: 9,
      title: "Simpan tx blockchain final jika mobile wallet dipakai",
      endpoint: "POST /api/batches/:id/blockchain",
      result: "Mobile mengirim txHash setelah transaksi wallet berhasil. Jika belum ada wallet mobile, finalisasi bisa tetap dari web.",
    },
  ],
  enums: {
    teaTypes: ["Green Tea", "Yellow Tea", "White Tea", "Oolong Tea", "Black Tea", "Dark Tea"],
    batchStatus: ["draft", "in_progress", "completed"],
    stageStatus: ["pending", "available", "completed", "skipped"],
    stageNames: ["plucking", "withering", "rolling", "predrying", "drying", "postdrying", "packing"],
    skippableStageNames: ["rolling", "postdrying"],
    workflowMode: ["dynamic-multi-path"],
  },
  productionFlows: TEA_PRODUCTION_FLOWS,
  stageFieldTemplates: STAGE_FIELD_TEMPLATES,
  responseModels: {
    batch: BATCH_MODEL,
    login: {
      token: "jwt-token",
      user: {
        id: "u-001",
        email: "user@example.com",
        name: "Operator Name",
        role: "admin | operator",
      },
    },
    traceability: {
      batch: {
        id: "uuid",
        batchCode: "TEA-2026-0001",
        teaType: "Black Tea",
        status: "draft | in_progress | completed",
      },
      summary: {
        totalStagesShown: 7,
        completedStages: 3,
        hiddenSkippedStages: 0,
      },
      finalTrace: {
        status: "ipfs_stored",
        ipfsCid: "Qm...",
        ipfsUrl: "https://gateway/ipfs/Qm...",
      },
      blockchainFinalization: {
        status: "awaiting_wallet_signature | anchored",
        txHash: "0x...",
        txUrl: "https://sepolia.etherscan.io/tx/0x...",
      },
      stages: [
        {
          order: 1,
          stageName: "plucking",
          label: "Plucking",
          status: "completed",
          operator: "Admin Tea Factory",
          recordedAt: "2026-05-21T08:00:00.000Z",
          data: STAGE_FIELD_TEMPLATES.plucking,
        },
      ],
    },
  },
  commonErrors: [
    { status: 400, meaning: "Input tidak lengkap, stage belum available, atau tahap tidak boleh di-skip." },
    { status: 401, meaning: "Token tidak ada/salah, login gagal, atau password API Docs salah." },
    { status: 404, meaning: "Batch, traceability, atau endpoint tidak ditemukan." },
    { status: 500, meaning: "Kesalahan backend saat proses data." },
    { status: 503, meaning: "Koneksi atau konfigurasi Supabase bermasalah pada login." },
  ],
  groups: [
    {
      title: "Authentication",
      description: "Login user Supabase dan penerbitan JWT untuk web atau mobile app.",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          access: "Public",
          mobileUse: true,
          description: "Login memakai email dan password user Supabase.",
          body: {
            email: "user@example.com",
            password: "string",
          },
          success: {
            token: "jwt-token",
            user: {
              id: "u-001",
              email: "user@example.com",
              name: "Operator Name",
              role: "admin",
            },
          },
          errors: {
            400: "Email dan password wajib diisi",
            401: "Email atau password salah",
            503: "Login gagal karena koneksi atau konfigurasi Supabase bermasalah",
          },
        },
      ],
    },
    {
      title: "System",
      description: "Status integrasi backend, storage, IPFS, blockchain, dan dokumentasi.",
      endpoints: [
        {
          method: "GET",
          path: "/api/system/web3-status",
          access: "Public",
          mobileUse: true,
          description: "Melihat status Supabase, Pinata, dan konfigurasi blockchain.",
          success: {
            storage: {
              provider: "supabase",
              enabled: true,
              activeKeyType: "publishable | service_role",
              projectRef: "pscobituhjquyrjpyhgx",
              url: "https://project.supabase.co",
            },
            blockchain: {
              enabled: true,
              network: "sepolia",
              chainId: 11155111,
              contractAddress: "0x...",
              transactionMode: "manual_metamask",
            },
            ipfs: {
              enabled: true,
              gateway: "gateway.pinata.cloud",
            },
          },
        },
        {
          method: "GET",
          path: "/api/system/api-docs",
          access: "Docs password",
          mobileUse: false,
          description: "Mengambil dokumentasi API untuk dashboard web. Mobile app tidak perlu memanggil endpoint ini.",
          headers: {
            "X-API-Docs-Password": "<API_DOCS_PASSWORD>",
          },
        },
      ],
    },
    {
      title: "Public Traceability",
      description: "Endpoint publik untuk QR/public traceability, bisa dipakai tanpa login.",
      endpoints: [
        {
          method: "GET",
          path: "/api/batches/public/:id/traceability",
          access: "Public",
          mobileUse: true,
          description: "Mengambil traceability publik batch. Tahap yang di-skip disembunyikan.",
          params: {
            id: "Batch UUID",
          },
          success: "responseModels.traceability",
          errors: {
            404: "Traceability tidak ditemukan",
          },
        },
      ],
    },
    {
      title: "Batches",
      description: "Endpoint batch produksi. Semua endpoint di grup ini butuh Bearer JWT.",
      endpoints: [
        {
          method: "GET",
          path: "/api/batches",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description: "Mengambil daftar batch produksi.",
          success: ["responseModels.batch"],
        },
        {
          method: "GET",
          path: "/api/batches/:id",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description:
            "Mengambil detail batch. Jika semua stage sudah completed/skipped, backend otomatis mencoba membuat final JSON Pinata.",
          params: {
            id: "Batch UUID",
          },
          success: "responseModels.batch",
          errors: {
            404: "Batch tidak ditemukan",
          },
        },
        {
          method: "POST",
          path: "/api/batches",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description: "Membuat batch produksi baru.",
          body: {
            batchCode: "TEA-2026-0001",
            teaType: "Black Tea",
            gardenBlock: "Block A-07",
            harvestDate: "2026-05-21T08:00",
            notes: "Catatan awal batch",
          },
          success: "responseModels.batch",
          errors: {
            400: "batchCode dan teaType wajib diisi / Kode batch sudah ada",
          },
        },
        {
          method: "POST",
          path: "/api/batches/:id/stages/:stageName",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description:
            "Menyimpan data tahap produksi yang sedang available. Pakai body sesuai stageFieldTemplates[stageName].",
          params: {
            id: "Batch UUID",
            stageName: "plucking | withering | rolling | predrying | drying | postdrying | packing",
          },
          body: {
            "...": "Gunakan template dari stageFieldTemplates sesuai stageName",
          },
          examples: {
            plucking: STAGE_FIELD_TEMPLATES.plucking,
            drying: STAGE_FIELD_TEMPLATES.drying,
          },
          success: "responseModels.batch",
          errors: {
            400: "Tahap belum tersedia untuk diproses",
            404: "Batch/tahap tidak ditemukan",
          },
        },
        {
          method: "POST",
          path: "/api/batches/:id/stages/:stageName/skip",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description:
            "Skip tahap opsional yang belum difinalisasi. Hanya stage dengan skippable true yang boleh di-skip.",
          params: {
            id: "Batch UUID",
            stageName: "rolling | postdrying",
          },
          body: {
            reason: "Keputusan skip dari awal proses",
          },
          success: "responseModels.batch",
          errors: {
            400: "Tahap sudah difinalisasi / Tahap ini tidak boleh di-skip",
            404: "Batch/tahap tidak ditemukan",
          },
        },
        {
          method: "POST",
          path: "/api/batches/:id/blockchain",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description:
            "Menyimpan tx hash final CID setelah transaksi wallet berhasil. Endpoint ini tidak mengirim transaksi blockchain; transaksi dilakukan dari wallet client.",
          params: {
            id: "Batch UUID",
          },
          body: {
            txHash: "0x...",
            walletAddress: "0x...",
            chainId: 11155111,
          },
          success: "responseModels.batch",
          errors: {
            400: "Tx hash wajib / CID final Pinata belum tersedia",
            404: "Batch tidak ditemukan",
          },
        },
        {
          method: "GET",
          path: "/api/batches/:id/history",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description: "Mengambil riwayat event batch dari Supabase.",
          params: {
            id: "Batch UUID",
          },
          success: [
            {
              id: "uuid",
              batchId: "uuid",
              batchCode: "TEA-2026-0001",
              stageName: "plucking",
              eventType: "stage_completed",
              action: "completed",
              status: "stored_supabase | anchored | failed",
              operator: "Admin Tea Factory",
              payload: {},
              recordedAt: "2026-05-21T08:00:00.000Z",
            },
          ],
          errors: {
            404: "Batch tidak ditemukan",
          },
        },
        {
          method: "GET",
          path: "/api/batches/:id/traceability",
          access: "Bearer JWT",
          mobileUse: true,
          headers: {
            Authorization: "Bearer <token>",
          },
          description: "Mengambil traceability internal batch. Tahap yang di-skip disembunyikan.",
          params: {
            id: "Batch UUID",
          },
          success: "responseModels.traceability",
          errors: {
            404: "Batch tidak ditemukan",
          },
        },
      ],
    },
  ],
};
