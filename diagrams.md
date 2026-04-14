# Diagram Alur Kerja dan Use Case

## Alur Kerja Pengguna

```mermaid
graph TD
    A[Start] --> B[Pengguna membuka web app]
    B --> C[Menu Utama]
    C --> D[Sistem menampilkan daftar Mitra Warung]
    D --> E[Pilih Mitra]
    E --> F[Sistem menampilkan daftar produk milik mitra tersebut]
    F --> G[Detail Produk]
    G --> H[End]

    subgraph Produk
        F --> F1[Harga]
        F --> F2[Deskripsi]
        F --> F3[Stok]
    end
```

## Use Case Diagram

```mermaid
usecaseDiagram
    actor Pengguna as Customer
    actor Admin as BuSoni

    Pengguna --> (Melihat daftar mitra)
    Pengguna --> (Mencari produk)
    Pengguna --> (Melihat detail produk dan harga)

    Admin --> (Mengelola data mitra)
    Admin --> (Mengelola data produk)

    note right of Admin
      Tambah/Edit/Hapus mitra
      Upload foto produk
      Update harga
    end note
```
