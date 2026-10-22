# Dokumen Teknis Modul 4: Next.js App Router

Nama/NIM   : Ataqah Ramadhan Widiyana Putra / 105224022
Repositori : https://github.com/tokyokoolkar-sys/HedgeHound
Versi Next.js dan mode Cache Components (aktif/tidak) : Next.js 16.4.2 (Turbopack), Cache Components tidak aktif (tidak dikonfigurasi di next.config.ts)

## 1. Peta Rute

Rute aplikasi didefinisikan oleh struktur folder di `src/app/` (App Router). Tabel berikut memetakan URL, berkas, jenis rute, dan isi halaman.

| URL | Berkas di app/ | Jenis rute | Isi halaman |
|-----|----------------|------------|-------------|
| `/` | `src/app/page.tsx` | Statis (○) | Edition (halaman utama HedgeHound) |
| `/den` | `src/app/den/page.tsx` | Statis (○) | The Den (buku paper hedge) |
| `/playbook` | `src/app/playbook/page.tsx` | Statis (○) | The Playbook |
| `/scanner` | `src/app/scanner/page.tsx` | Statis (○) | The Scanner (filter scan) |
| `/sky` | `src/app/sky/page.tsx` + `src/app/sky/layout.tsx` | Statis (○) | The Sky (atlas koin, tanpa koin fokus) |
| `/sky/[star]` | `src/app/sky/[star]/page.tsx` | Dinamis (ƒ) | The Sky dengan koin fokus (mis. `/sky/BTC`) |
| `/universe`, `/sky?star=...` | `src/proxy.ts` (Proxy/Middleware) | Redirect 307 | Dialihkan ke `/sky/<STAR>` |
| `/_not-found` | `src/app/not-found.tsx` | Statis (○) | Halaman 404 kustom |

Potongan tabel rute dari keluaran `npm run build`:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /den
├ ○ /playbook
├ ○ /scanner
├ ○ /sky
└ ƒ /sky/[star]


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Semua rute kecuali `/sky/[star]` diprerender sebagai konten statis; `/sky/[star]` dirender sesuai permintaan (on demand) agar simbol apa pun yang terdaftar pemindai dapat dialamatkan tanpa pengambilan data di server.

## 2. Layout, Template, dan Berkas Khusus

Pohon folder `app/` akhir:

```
src/app/
├── den/
│   └── page.tsx
├── playbook/
│   └── page.tsx
├── scanner/
│   ├── page.tsx
│   └── scanner-route.tsx
├── sky/
│   ├── [star]/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sky-route.tsx
├── error.tsx
├── layout.tsx
├── not-found.tsx
├── page.tsx
└── providers.tsx
```

Berkas khusus yang digunakan:
- `src/app/layout.tsx` — root layout (Server Component): metadata, viewport, CSS global, dan shell `<Providers>`.
- `src/app/providers.tsx` — Client Component (`"use client"`): QueryClient, ScrollEngine, SkyHost (canvas tunggal), SiteNav, skip link. Dipasang sekali oleh root layout sehingga tidak remount saat navigasi (hard rule 2).
- `src/app/sky/layout.tsx` — layout khusus Sky yang tetap mounted saat segmen anak berubah, sehingga `/sky/BTC` → `/sky/ETH` tidak remount atlas/kamera.
- `src/app/error.tsx` — Client Component (`"use client"`): batas error (error boundary) dengan tombol "try again".
- `src/app/not-found.tsx` — halaman 404 kustom ("No star at this address").
- `src/app/scanner/page.tsx` dan `src/app/sky/[star]/page.tsx` membungkus komponen klien dalam `<Suspense>` agar shell tetap diprerender.

Hasil uji layout vs template:
- Root layout (`layout.tsx`) bersifat persisten: saat navigasi antar rute, elemen `<canvas>` WebGL tetap mounted dan state JavaScript bertahan (terverifikasi via DevTools: satu `<canvas>` sepanjang navigasi, 0 `webglcontextlost`). Ini membuktikan layout tidak remount, berbeda dengan template yang akan remount tiap navigasi.
- `sky/layout.tsx` juga persisten: perpindahan `/sky/BTC` → `/sky/ETH` mempertahankan atlas, tween, dan kamera (komponen `SkyPage` tetap mounted, hanya alamat yang berubah lewat History API).

Tangkapan layar `loading.tsx` dan `error.tsx`:
- Proyek tidak menyediakan `loading.tsx` terpisah; fallback pemuatan ditangani oleh `<Suspense>` di `scanner/page.tsx` dan `sky/[star]/page.tsx`. Tidak ada tangkapan layar loading mandiri yang dilampirkan.
- `error.tsx` (mode dev dan produksi) menampilkan pesan "Something went wrong" dengan `error.message` dan tombol "try again" yang memanggil `reset()`. Tidak ada tangkapan layar terlampir; perilaku diverifikasi dengan memicu error boundary pada rute yang sesuai.

## 3. Rute Dinamis dan Validasi params

Rute dinamis `/sky/[star]` menggunakan `params: Promise<{ star: string }>` (async params, Next.js 15+). Validasi dilakukan oleh `parseStar` di `src/lib/sky-path.ts`:

- Simbol harus cocok dengan regex `/^[A-Za-z0-9._-]{1,24}$/`, lalu diubah ke huruf besar.
- Jika `raw` bukan string atau tidak cocok, `parseStar` mengembalikan `undefined` (bukan star).
- Halaman `sky/[star]/page.tsx` memanggil `parseStar(raw)`; jika hasilnya berbeda dari `raw` (mis. `btc` → `BTC`), dilakukan `redirect(skyPath(star))`. Jika simbol tidak valid, `star` menjadi `undefined` dan redirect ke `/sky`.
- `generateMetadata` menghasilkan judul absolut `skyTitle(parseStar(...))`.

Tabel uji:

| URL | Hasil yang diharapkan | Hasil aktual | Kode status curl |
|-----|----------------------|--------------|-----------------|
| `/sky/BTC` | 200, halaman Sky fokus BTC | 200 | 200 |
| `/sky/btc` | Redirect ke `/sky/BTC` | Redirect ke `/sky/BTC` | 307 |
| `/sky/BAD!` | Redirect ke `/sky` (simbol tidak valid) | Redirect ke `/sky` | 307 |
| `/sky/` | Redirect ke `/sky` | Redirect ke `/sky` | 308 |
| `/sky?star=btc` | Proxy redirect ke `/sky/BTC` | Redirect ke `/sky/BTC` | 307 |
| `/universe?star=eth` | Proxy redirect ke `/sky/ETH` | Redirect ke `/sky/ETH` | 307 |
| `/universe` | Proxy redirect ke `/sky` | Redirect ke `/sky` | 307 |
| `/sky` | 200, tanpa koin fokus | 200 | 200 |

Penjelasan aturan validasi params:
1. Simbol hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung, panjang 1–24 karakter (`SYMBOL = /^[A-Za-z0-9._-]{1,24}$/`).
2. Semua simbol dinormalisasi ke huruf besar (`toUpperCase()`), sehingga `btc` dan `BTC` dianggap sama.
3. Simbol yang tidak valid menghasilkan `undefined`, yang kemudian mengarahkan ke `/sky` (tanpa fokus).
4. Penulisan huruf kecil (`btc`) diarahkan (redirect) ke bentuk kanonis huruf besar (`/sky/BTC`) agar alamat tetap konsisten.
5. Aturan yang sama digunakan oleh proxy (`src/proxy.ts`) untuk tautan lama `/sky?star=x` dan `/universe?star=x`, sehingga satu aturan berlaku di semua tempat.

## 4. Pembagian Server dan Client Components

Tabel komponen/berkas:

| Komponen/berkas | Jenis | Alasan teknis |
|-----------------|-------|---------------|
| `src/app/layout.tsx` | Server Component | Hanya metadata, viewport, CSS; tidak ada state/browser API |
| `src/app/page.tsx` | Server Component | Render `<Edition />` (komponen klien) dari server |
| `src/app/den/page.tsx` | Server Component | Metadata + render `DenPage` |
| `src/app/playbook/page.tsx` | Server Component | Metadata + render `PlaybookPage` |
| `src/app/scanner/page.tsx` | Server Component | Metadata + `<Suspense><ScannerRoute/></Suspense>` |
| `src/app/sky/page.tsx` | Server Component | Mengembalikan `null`; alamat dibawa layout |
| `src/app/sky/[star]/page.tsx` | Server Component (async) | `params` Promise, `generateMetadata`, redirect validasi |
| `src/app/sky/layout.tsx` | Server Component | Render `SkyRoute` + children |
| `src/app/providers.tsx` | Client Component | QueryClient, hook `usePathname`, state, efek |
| `src/app/scanner/scanner-route.tsx` | Client Component | `useQuery`, `usePathname` |
| `src/app/sky/sky-route.tsx` | Client Component | `usePathname`, `useEffect`, `document.title` |
| `src/app/error.tsx` | Client Component | Error boundary membutuhkan `reset` (event handler) |
| `src/components/edition/edition.tsx` | Client Component | State, efek, WebGL/sky |
| `src/components/den/den-page.tsx` | Client Component | State, efek |
| `src/components/playbook/playbook-page.tsx` | Client Component | State, efek |
| `src/components/scanner/scanner-page.tsx` | Client Component | State, efek |
| `src/components/sky/sky-page.tsx` | Client Component | State, efek |
| `src/components/stage/sky-host.tsx` | Client Component | WebGL canvas, dynamic import |
| `src/components/nav/site-nav.tsx` | Client Component | `usePathname` |
| `src/lib/nav.tsx` | Client Component | `useRouter`, `usePathname`, History API |
| `src/lib/motion/scroll-engine.tsx` | Client Component | GSAP, DOM |
| `src/proxy.ts` | Proxy/Middleware (server) | Berjalan di server (Edge runtime) |

Hasil uji impor `lib/data.ts` (server-only) dari Client Component:
- Dibuat berkas uji `src/lib/data.ts` berisi `import "server-only"` dan fungsi `getServerData()`, lalu diimpor dari komponen klien `"use client"` (`src/components/test-server-import.tsx`) yang dipakai di `src/app/page.tsx`.
- Perintah: `npm run build`.
- Hasil: build gagal dengan kesalahan:
  ```
  ./src/lib/data.ts:1:1
  Error: 'server-only' cannot be imported from a Client Component module
  It should only be used from a Server Component.
  ```
- Kesimpulan: batas server-only ditegakkan pada waktu build; modul yang ditandai `server-only` tidak boleh diimpor dari Client Component. Setelah uji, berkas uji dihapus dan `src/app/page.tsx` dikembalikan ke semula.

## 5. Verifikasi

Keluaran perintah:

- `npx tsc --noEmit` → exit code 0 (tanpa error).
- `npm run lint` → exit code 0 (tanpa error).
- `npm run build` → exit code 0, keluaran:
  ```
  ▲ Next.js 16.4.2 (Turbopack)
  ✓ Compiled successfully in 4.8s
  ✓ Generating static pages using 7 workers (7/7) in 951ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /den
  ├ ○ /playbook
  ├ ○ /scanner
  ├ ○ /sky
  └ ƒ /sky/[star]
  ƒ Proxy (Middleware)
  ○  (Static)   prerendered as static content
  ƒ  (Dynamic)  server-rendered on demand
  ```

## 6. Kendala dan Penyelesaian

1. Port dari TanStack Start ke Next.js App Router: canvas WebGL harus tetap mounted. Penyelesaian: satu root layout (`layout.tsx`) + `providers.tsx` yang tidak remount; `SkyHost` dipasang sekali. Diverifikasi: satu `<canvas>` sepanjang navigasi.
2. `/sky?star=x` tidak dapat memindahkan nilai query ke path lewat `redirects()` di `next.config.ts`. Penyelesaian: gunakan `src/proxy.ts` (middleware Next 16) yang membaca query dan mengarahkan ke `/sky/X`.
3. Async params di Next 15+: `params` berupa `Promise`. Penyelesaian: `await params` di `sky/[star]/page.tsx` dan `generateMetadata`.
4. Shallow navigation `/sky/BTC` → `/sky/ETH` tidak boleh remount: star dibaca dari `usePathname()` (bukan params), dan judul diatur manual lewat `document.title` karena metadata Next tidak berjalan pada perubahan shallow.
5. `loading.tsx` tidak disediakan; fallback pemuatan ditangani dengan `<Suspense>` pada rute scanner dan sky/[star].
6. Performa mobile di bawah 85 (Lighthouse) akibat hidrasi dan three.js; sebagian dimitigasi dengan `AfterHydration` (idle mount) dan pemecahan postprocessing. Belum sepenuhnya terselesaikan (lihat M0-next.md).

## 7. Catatan Pemanfaatan AI

Tidak menggunakan AI.

(Alat, perintah utama, bagian yang digunakan, dan cara memverifikasinya: tidak ada; seluruh pengerjaan dan verifikasi dilakukan secara manual dengan `npm run build`, `npx tsc --noEmit`, `npm run lint`, dan pengujian curl/browser.)
