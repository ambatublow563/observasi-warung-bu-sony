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
    button.classList.remove('gradient-bg', 'text-white');
    button.classList.add('text-purple-300');
  });
  tabButton.classList.remove('text-purple-300');
  tabButton.classList.add('gradient-bg', 'text-white');
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
  card.className = 'group overflow-hidden rounded-xl border border-purple-600/30 bg-purple-900/50 backdrop-blur-sm shadow-sm transition hover:shadow-lg hover:-translate-y-1';
  card.innerHTML = `
    <div class="p-6">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🏪</span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white">${mitra.nama_mitra}</h3>
          <p class="text-sm text-purple-200">${mitra.lokasi}</p>
        </div>
        <div class="bg-purple-700/50 px-3 py-1 rounded-full">
          <span class="text-sm font-medium text-purple-200">${mitra.kategori}</span>
        </div>
      </div>
      <p class="text-purple-100 text-sm mb-4 line-clamp-2">${mitra.deskripsi}</p>
      <div class="flex items-center justify-between">
        <span class="text-sm text-purple-200">${mitra.produk_count} produk tersedia</span>
        <button class="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition" data-mitra-id="${mitra.mitra_id}">Lihat Menu</button>
      </div>
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
    productListEl.innerHTML = '<p class="text-purple-300 col-span-full text-center py-8">Tidak ada produk yang cocok.</p>';
    return;
  }

  products.forEach((product) => {
    const imageUrl = normalizeImageUrl(product.foto_url);
    const card = document.createElement('article');
    card.className = 'bg-purple-900/50 backdrop-blur-sm rounded-xl shadow-sm border border-purple-600/30 overflow-hidden transition hover:shadow-lg hover:-translate-y-1';
    card.innerHTML = `
      <div class="aspect-square overflow-hidden">
        <img src="${imageUrl}" alt="${product.nama_produk}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x300?text=Gambar+tidak+tersedia'" />
      </div>
      <div class="p-4">
        <h4 class="text-sm font-medium text-white line-clamp-2 mb-2">${product.nama_produk}</h4>
        <p class="text-xs text-purple-200 mb-2">${product.kategori}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-white">${formatRupiah(product.harga)}</span>
          <span class="bg-green-700/50 text-green-300 text-xs px-2 py-1 rounded-full">Stok ${product.stok}</span>
        </div>
        <button class="w-full gradient-bg text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition" data-product-id="${product.produk_id}">Lihat Detail</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => renderProductDetail(product.produk_id));
    productListEl.appendChild(card);
  });
}

function renderProductDetail(produkId) {
  const product = currentProducts.find((item) => item.produk_id === produkId);
  if (!product) {
    productDetailEl.innerHTML = '<p class="text-gray-500 text-sm">Produk tidak ditemukan.</p>';
    return;
  }

  const imageUrl = normalizeImageUrl(product.foto_url);
  productDetailEl.innerHTML = `
    <div class="space-y-4">
      <div class="aspect-square overflow-hidden rounded-lg bg-purple-800/50">
        <img src="${imageUrl}" alt="Foto ${product.nama_produk}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x300?text=Gambar+tidak+tersedia'" />
      </div>
      <div class="space-y-3">
        <div>
          <h4 class="text-lg font-semibold text-white">${product.nama_produk}</h4>
          <p class="text-sm text-purple-200">${product.kategori}</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-white">${formatRupiah(product.harga)}</span>
          <span class="bg-green-700/50 text-green-300 text-sm px-3 py-1 rounded-full">Stok ${product.stok}</span>
        </div>
        <div class="space-y-2 text-sm text-purple-200">
          <p><span class="font-medium text-white">Sekolah:</span> ${product.sekolah}</p>
          <p><span class="font-medium text-white">ID Produk:</span> ${product.produk_id}</p>
        </div>
        <button class="w-full gradient-bg text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition">
          Tambah ke Keranjang
        </button>
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
