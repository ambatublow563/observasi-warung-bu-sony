const mitraListEl = document.getElementById('mitraList');
const productListEl = document.getElementById('productList');
const productDetailEl = document.getElementById('productDetail');
const selectedMitraNameEl = document.getElementById('selectedMitraName');
const selectedMitraSubtitleEl = document.getElementById('selectedMitraSubtitle');
const backButton = document.getElementById('backButton');
const produkSection = document.getElementById('produk-section');
const accountSection = document.getElementById('account-section');
const searchInput = document.getElementById('searchInput');
const errorMessage = document.getElementById('errorMessage');
const productCountEl = document.getElementById('productCount');
const availableCountEl = document.getElementById('availableCount');
const navHome = document.getElementById('navHome');
const navMitra = document.getElementById('navMitra');
const navProduk = document.getElementById('navProduk');
const navAkun = document.getElementById('navAkun');

let mitraData = [];
let produkData = [];
let currentMitraId = null;
let currentProducts = [];

function loadJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Gagal memuat ${path}: ${response.statusText}`);
    }
    return response.json();
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function hideAllSections() {
  produkSection.classList.add('hidden');
  accountSection.classList.add('hidden');
}

function activateMobileTab(tabButton) {
  [navHome, navMitra, navProduk, navAkun].forEach((button) => {
    button.classList.remove('text-slate-900', 'bg-slate-100');
    button.classList.add('text-slate-600');
  });
  tabButton.classList.remove('text-slate-600');
  tabButton.classList.add('text-slate-900', 'bg-slate-100');
}

function goHome() {
  hideError();
  hideAllSections();
  resetView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  activateMobileTab(navHome);
}

function goMitra() {
  hideError();
  hideAllSections();
  resetView();
  document.getElementById('mitra-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateMobileTab(navMitra);
}

function goProduk() {
  hideError();
  if (!currentMitraId) {
    showError('Pilih Warung Bu Soni terlebih dahulu untuk melihat produk.');
    document.getElementById('mitra-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    activateMobileTab(navMitra);
    return;
  }
  hideAllSections();
  produkSection.classList.remove('hidden');
  document.getElementById('produk-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateMobileTab(navProduk);
}

function goAkun() {
  hideError();
  hideAllSections();
  accountSection.classList.remove('hidden');
  accountSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  activateMobileTab(navAkun);
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value));
}

function normalizeImageUrl(url) {
  if (!url) {
    return 'https://via.placeholder.com/640x360?text=Gambar+tidak+tersedia';
  }
  const driveFileId = url.match(/\/d\/([a-zA-Z0-9_-]+)\//)?.[1] || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (driveFileId) {
    return `https://lh3.googleusercontent.com/d/${driveFileId}`;
  }
  return url;
}

function createMitraCard(mitra) {
  const card = document.createElement('article');
  card.className = 'group overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1';
  card.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="text-xl font-semibold text-slate-900">${mitra.nama_mitra}</h3>
        <p class="mt-2 text-sm text-slate-500">${mitra.lokasi}</p>
      </div>
      <div class="rounded-2xl bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">${mitra.kategori}</div>
    </div>
    <p class="mt-4 text-slate-600">${mitra.deskripsi}</p>
    <div class="mt-6 flex items-center justify-between gap-3">
      <span class="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">${mitra.produk_count} produk</span>
      <button class="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700" data-mitra-id="${mitra.mitra_id}">Lihat Produk</button>
    </div>
  `;
  card.querySelector('button').addEventListener('click', () => selectMitra(mitra.mitra_id));
  return card;
}

function renderMitraList() {
  mitraListEl.innerHTML = '';
  mitraData.forEach((mitra) => mitraListEl.appendChild(createMitraCard(mitra)));
}

function renderProductList(products) {
  productListEl.innerHTML = '';
  if (!products.length) {
    productListEl.innerHTML = '<p class="text-slate-500">Tidak ada produk yang cocok.</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-white';
    card.innerHTML = `
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h4 class="text-lg font-semibold text-slate-900">${product.nama_produk}</h4>
            <p class="mt-1 text-sm text-slate-500">Kategori: ${product.kategori}</p>
          </div>
          <span class="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Stok ${product.stok}</span>
        </div>
        <div class="flex items-center justify-between gap-4 text-slate-700">
          <span class="text-lg font-semibold text-slate-900">${formatRupiah(product.harga)}</span>
          <button class="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700" data-product-id="${product.produk_id}">Lihat Detail</button>
        </div>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => renderProductDetail(product.produk_id));
    productListEl.appendChild(card);
  });
}

function renderProductDetail(produkId) {
  const product = currentProducts.find((item) => item.produk_id === produkId);
  if (!product) {
    productDetailEl.innerHTML = '<p class="text-slate-500">Produk tidak ditemukan.</p>';
    return;
  }

  const imageUrl = normalizeImageUrl(product.foto_url);
  productDetailEl.innerHTML = `
    <div class="space-y-4">
      <div class="overflow-hidden rounded-3xl bg-slate-100">
        <img src="${imageUrl}" alt="Foto ${product.nama_produk}" class="h-72 w-full object-cover" onerror="this.src='https://via.placeholder.com/640x360?text=Gambar+tidak+tersedia'" />
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h4 class="text-xl font-semibold text-slate-900">${product.nama_produk}</h4>
            <p class="text-sm text-slate-500">${product.kategori}</p>
          </div>
          <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">Stok ${product.stok}</span>
        </div>
        <p class="text-slate-600">Sekolah: <span class="font-semibold text-slate-900">${product.sekolah}</span></p>
        <p class="text-slate-600">Harga: <span class="font-semibold text-slate-900">${formatRupiah(product.harga)}</span></p>
        <p class="text-slate-600">ID Produk: <span class="font-mono text-sm text-slate-500">${product.produk_id}</span></p>
      </div>
    </div>
  `;
}

function selectMitra(mitraId) {
  currentMitraId = mitraId;
  const mitra = mitraData.find((item) => item.mitra_id === mitraId);
  if (!mitra) return;

  selectedMitraNameEl.textContent = mitra.nama_mitra;
  selectedMitraSubtitleEl.textContent = mitra.lokasi;
  produkSection.classList.remove('hidden');
  window.scrollTo({ top: produkSection.offsetTop - 24, behavior: 'smooth' });

  currentProducts = produkData.filter((product) => product.mitra_id === mitraId);
  productCountEl.textContent = currentProducts.length;
  availableCountEl.textContent = currentProducts.filter((product) => Number(product.stok) > 0).length;
  renderProductList(currentProducts);
  renderProductDetail(currentProducts[0]?.produk_id || '');
}

function resetView() {
  currentMitraId = null;
  produkSection.classList.add('hidden');
  productListEl.innerHTML = '';
  productDetailEl.innerHTML = '<p class="text-slate-500">Belum ada produk dipilih.</p>';
  selectedMitraNameEl.textContent = '';
  selectedMitraSubtitleEl.textContent = '';
}

function applySearchFilter() {
  const query = searchInput.value.trim().toLowerCase();
  if (!currentMitraId) {
    const filteredMitra = mitraData
      .map((mitra) => {
        const matchedProducts = produkData.filter((product) => product.mitra_id === mitra.mitra_id && product.nama_produk.toLowerCase().includes(query));
        return { ...mitra, produk_count: matchedProducts.length, hasMatch: matchedProducts.length > 0 };
      })
      .filter((mitra) => mitra.hasMatch || query === '');

    mitraListEl.innerHTML = '';
    filteredMitra.forEach((mitra) => mitraListEl.appendChild(createMitraCard(mitra)));
    return;
  }

  const filteredProducts = currentProducts.filter((product) => product.nama_produk.toLowerCase().includes(query));
  renderProductList(filteredProducts);
}

backButton.addEventListener('click', resetView);
searchInput.addEventListener('input', applySearchFilter);
navHome.addEventListener('click', goHome);
navMitra.addEventListener('click', goMitra);
navProduk.addEventListener('click', goProduk);
navAkun.addEventListener('click', goAkun);

async function bootstrap() {
  try {
    hideError();
    [mitraData, produkData] = await Promise.all([
      loadJson('data/mitra_rows.json'),
      loadJson('data/produk_rows.json'),
    ]);

    const productCounts = produkData.reduce((acc, product) => {
      acc[product.mitra_id] = (acc[product.mitra_id] || 0) + 1;
      return acc;
    }, {});

    mitraData = mitraData.map((mitra) => ({
      ...mitra,
      produk_count: productCounts[mitra.mitra_id] || 0,
    }));

    renderMitraList();
    activateMobileTab(navHome);
  } catch (error) {
    showError(error.message);
  }
}

bootstrap();
