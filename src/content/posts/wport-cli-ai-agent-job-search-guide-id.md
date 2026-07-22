---
title: "Panduan WPORT CLI: Biarkan AI Agent Mencari Lowongan dan Mengambil Data Langsung di Terminal"
description: "Install @wport/cli, cari lowongan WPORT dengan satu perintah, dan keluarkan JSON agar Cursor serta AI Agent lain bisa lanjut memproses. Termasuk langkah instalasi, perintah umum, parameter ramah Agent, dan contoh praktis."
publishDate: 2026-07-07
tags: ["WPORT 功能", "AI 實作", "求職面試"]
featured: false
cover: "https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg"
---

<figure>
  <img src="https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg" alt="Demo pencarian lowongan WPORT CLI di terminal" />
  <figcaption>WPORT CLI memungkinkan AI Agent mencari lowongan di terminal dan mengeluarkan data terstruktur.</figcaption>
</figure>

Saat Anda bilang ke AI di Cursor “carikan lowongan PM di Taoyuan,” biasanya ia hanya bisa search web atau minta Anda copy-paste manual.

Kalau kita ubah **pencarian lowongan menjadi CLI**, AI Agent bisa menjalankan perintah di terminal, mendapat JSON terstruktur, lalu lanjut ke kustom resume, pencocokan JD, bahkan menulis ke catatan Obsidian. Itulah alasan [WPORT CLI](https://www.npmjs.com/package/@wport/cli) (`@wport/cli`) ada.

---

## Mengapa CLI, bukan webpage?

Antarmuka web cocok untuk klik manusia. **Command-line interface (CLI) cocok untuk program dan AI Agent.**

| Situasi | Web GUI | WPORT CLI |
|------|----------|-----------|
| Manusia browsing lowongan | Intuitif dan bagus dilihat | Bisa, tapi bukan fokus utama |
| AI Agent search otomatis | Perlu simulasi klik, tidak stabil | Satu perintah, stabil |
| Output untuk Skill berikutnya | Harus scrape HTML | JSON / NDJSON native |
| Masuk skrip atau CI | Sulit | `pipe` ke `jq` |

WPORT CLI adalah antarmuka terminal untuk public API W101 Talent Search Center. Pencarian dan lihat lowongan publik **tidak perlu login**. Manajemen lowongan sisi perusahaan punya subcommand `enterprise` terpisah (butuh API Key; dibahas singkat di akhir).

> **Catatan versi**: Rilis npm terbaru saat ini `0.5.0`, masih tahap pra-rilis `0.x`. Domain API dan perintah bisa berubah. Kunci nomor versi di skrip otomasi.

---

## Instalasi

Butuh **Node.js >= 18.17**.

```bash
npm install -g @wport/cli
```

Setelah terpasang, ketik `wport` di terminal. Jika AI Agent (misalnya Cursor Agent) punya akses terminal, ia juga bisa menjalankan perintah ini untuk Anda.

Verifikasi lingkungan:

```bash
wport doctor
```

`doctor` menampilkan API base yang dikonfigurasi, locale, status koneksi, serta perilaku API yang perlu diperhatikan Agent (misalnya field sorting ditentukan server, client tidak bisa override).

---

## Mulai cepat dalam tiga langkah

### 1. Cari lowongan

```bash
wport jobs search --keyword "產品經理"
```

Tambahkan kode wilayah untuk mempersempit hasil (kode wilayah bisa diulang dengan `-l`):

```bash
wport jobs search --keyword "PM" -l 6001001000
```

Secara default terminal menampilkan **tabel**. Jika output di-pipe, otomatis beralih ke **JSON** agar mudah diproses selanjutnya.

### 2. Lihat detail satu lowongan

Salin `enc_id` dari hasil pencarian, lalu jalankan:

```bash
wport jobs view <enc_id>
```

Anda juga bisa ambil satu field saja agar AI membaca lebih sedikit token:

```bash
wport jobs view <enc_id> --field job_info.job_title
```

### 3. Keluarkan JSON untuk Agent atau jq

```bash
wport jobs search --keyword backend --output json
```

Kalau hanya butuh field yang diperlukan Agent, pakai `--minimal` (set field ringkas):

```bash
wport jobs search --keyword backend --minimal --output json
```

Atau tentukan field sendiri:

```bash
wport jobs search --keyword backend --fields enc_id,title --output json
```

`--minimal` dan `--fields` memotong JSON di sisi **client**, supaya LLM membaca lebih sedikit field tidak relevan. Ukuran transmisi jaringan tetap sama. Ini dirancang khusus untuk workflow Agent.

---

## Contoh praktis untuk AI Agent

### Contoh A: Search → ekstrak enc_id → baca judul secara batch

```bash
wport jobs search --keyword backend --fields enc_id --output json \
  | jq -r '.data[].enc_id' \
  | wport jobs view - --batch --field job_info.job_title
```

Mode `--batch` membaca banyak `enc_id` dari stdin dan mengeluarkan NDJSON baris demi baris. Satu kegagalan tidak menghentikan seluruh batch. Cocok untuk Agent yang memproses banyak JD sekaligus.

### Contoh B: Minta Agent menjalankannya di Cursor

Di mode Agent Cursor, Anda bisa bilang:

> Jalankan `wport jobs search --keyword "桃園 產品經理" --minimal --output json` di terminal, susun hasilnya jadi tabel Markdown, dan tandai 3 listing paling cocok untuk fresh graduate.

Agent akan memanggil CLI, mendapat JSON, lalu lanjut menghasilkan saran resume menurut Skill atau percakapan Anda. Jauh lebih andal daripada minta ia “cari lowongan di website.”

### Contoh C: Query lanjutan (`--json-query`)

Sebagian filter (tahun pengalaman, mode remote, rentang gaji, dll.) belum diekspos sebagai flag pendek. Tulis ke file JSON lalu masukkan:

```bash
wport jobs search --json-query ./my-search.json --output json
```

Struktur JSON mengikuti `JobSearchDto` di sisi server, cocok untuk skrip lanjutan atau Agent yang menghasilkan file query secara dinamis.

---

## Locale dan pengaturan pribadi

String antarmuka CLI tetap. `--lang` memengaruhi **bahasa konten respons API** (deskripsi lowongan, dll.):

```bash
wport jobs search --keyword backend --lang en-US
```

Simpan preferensi secara persisten:

```bash
wport config set locale zh-TW
wport config get
```

Item yang bisa disetel: `locale`, `output`, `timeout_ms`. Alamat API pakai environment variable atau flag, jangan tulis ke config (pertimbangan keamanan):

```bash
WPORT_API_BASE=https://api.wport.me wport jobs search --keyword backend
# atau sekali jalan
wport jobs search --keyword backend --api https://api.wport.me
```

---

## Perintah enterprise (pihak rekrutmen)

Jika Anda mengelola lowongan WPORT untuk perusahaan, gunakan subcommand `wport enterprise` (butuh API Key enterprise `wpk_live_...`; hubungi tim BD untuk mendapatkannya):

```bash
wport enterprise login          # simpan kunci dengan aman (tidak muncul di shell history)
wport enterprise jobs list --status published
wport enterprise jobs create --file new-job.json
wport enterprise talents list --tab applied
```

Perintah enterprise **sepenuhnya terpisah** dari `wport jobs` publik. Tanpa login, Anda tidak menyentuh API sisi employer. CI / Agent juga bisa meneruskan kunci lewat environment variable:

```bash
WPORT_API_KEY=wpk_live_... wport enterprise jobs list --minimal --output json
```

---

## Exit code dan rate limit

Saat Agent menulis skrip, gunakan exit code untuk menilai hasil:

| Code | Arti |
|------|------|
| `0` | Berhasil |
| `2` | Argumen salah |
| `3` | Server 4xx |
| `4` | Server 5xx / error jaringan |
| `5` | Config rusak |

Endpoint pencarian lowongan publik dibatasi sekitar **1200 request / menit / IP**, cukup untuk interaksi biasa dan Agent single-thread. Jangan gunakan crawler multi-proses untuk request massal.

---

## Mengapa kami mendesain seperti ini?

1. **Agent first**: `--minimal`, `--fields`, `--batch`, dan default JSON yang ramah pipe membantu AI membaca lebih sedikit noise dan melakukan lebih banyak pekerjaan.
2. **Publik dan enterprise terpisah**: Pencari kerja memakai `wport jobs` tanpa akun. Fitur perusahaan ada di `enterprise`, dengan izin kunci yang jelas.
3. **Bisa di-script**: Disambung dengan `jq`, Skill, dan toolchain MCP, “cari lowongan” menjadi satu mata rantai di pipeline kustom resume dan tracking lamaran.

Ini juga inti demo di Charging Station Vol.3: satu `wport jobs search`, lowongan PM Taoyuan langsung masuk workflow Agent. Kalau Anda melewatkan kelas, artikel ini adalah buku pemulihan.

---

## Langkah berikutnya

- **Install paket**: [npmjs.com/package/@wport/cli](https://www.npmjs.com/package/@wport/cli)
- **Jika ada masalah**: Jalankan `wport doctor` dulu. Di tahap `0.x`, email [yao@wport.me](mailto:yao@wport.me)
- **Cari lowongan di situs**: [wport.me](https://wport.me/)

Kami akan terus memperbarui zona “WPORT features” dengan perintah baru, contoh integrasi Agent, dan trade-off desain produk. Simpan artikel ini, dan lain kali buka Cursor langsung minta Agent menjalankan `wport`.
