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

// GSAP Animation Function
function fadeContent(element, options = {}) {
  const {
    blur = false,
    duration = 1000,
    ease = 'power2.out',
    delay = 0,
    threshold = 0.1,
    initialOpacity = 0,
    disappearAfter = 0,
    disappearDuration = 0.5,
    disappearEase = 'power2.in',
    onComplete,
    onDisappearanceComplete
  } = options;

  if (!element) return;

  const startPct = (1 - threshold) * 100;
  const getSeconds = val => (typeof val === 'number' && val > 10 ? val / 1000 : val);

  gsap.set(element, {
    autoAlpha: initialOpacity,
    filter: blur ? 'blur(10px)' : 'blur(0px)',
    willChange: 'opacity, filter, transform'
  });

  const tl = gsap.timeline({
    paused: true,
    delay: getSeconds(delay),
    onComplete: () => {
      if (onComplete) onComplete();
      if (disappearAfter > 0) {
        gsap.to(element, {
          autoAlpha: initialOpacity,
          filter: blur ? 'blur(10px)' : 'blur(0px)',
          delay: getSeconds(disappearAfter),
          duration: getSeconds(disappearDuration),
          ease: disappearEase,
          onComplete: () => onDisappearanceComplete?.()
        });
      }
    }
  });

  tl.to(element, {
    autoAlpha: 1,
    filter: 'blur(0px)',
    duration: getSeconds(duration),
    ease: ease
  });

  const st = ScrollTrigger.create({
    trigger: element,
    start: `top ${startPct}%`,
    once: true,
    onEnter: () => tl.play()
  });

  return () => {
    st.kill();
    tl.kill();
    gsap.killTweensOf(element);
  };
}

// Apply animation to mitra list and product list
if (mitraListEl) {
  fadeContent(mitraListEl, { blur: true, duration: 800 });
}
if (productListEl) {
  fadeContent(productListEl, { blur: true, duration: 800 });
}

// FloatingLines Background Animation
function FloatingLines(container, options = {}) {
  const {
    linesGradient,
    enabledWaves = ['top', 'middle', 'bottom'],
    lineCount = [6],
    lineDistance = [5],
    topWavePosition,
    middleWavePosition,
    bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
    animationSpeed = 1,
    interactive = true,
    bendRadius = 5.0,
    bendStrength = -0.5,
    mouseDamping = 0.05,
    parallax = true,
    parallaxStrength = 0.2,
    mixBlendMode = 'screen'
  } = options;

  let active = true;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '-1';
  renderer.domElement.style.mixBlendMode = mixBlendMode;
  container.appendChild(renderer.domElement);

  const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

  const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    
    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // radial falloff around cursor
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

  const getLineCount = waveType => {
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    const index = enabledWaves.indexOf(waveType);
    return lineCount[index] ?? 6;
  };

  const getLineDistance = waveType => {
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    const index = enabledWaves.indexOf(waveType);
    return lineDistance[index] ?? 0.1;
  };

  const topLineCount = enabledWaves.includes('top') ? getLineCount('top') : 0;
  const middleLineCount = enabledWaves.includes('middle') ? getLineCount('middle') : 0;
  const bottomLineCount = enabledWaves.includes('bottom') ? getLineCount('bottom') : 0;

  const topLineDistance = enabledWaves.includes('top') ? getLineDistance('top') * 0.01 : 0.01;
  const middleLineDistance = enabledWaves.includes('middle') ? getLineDistance('middle') * 0.01 : 0.01;
  const bottomLineDistance = enabledWaves.includes('bottom') ? getLineDistance('bottom') * 0.01 : 0.01;

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    animationSpeed: { value: animationSpeed },

    enableTop: { value: enabledWaves.includes('top') },
    enableMiddle: { value: enabledWaves.includes('middle') },
    enableBottom: { value: enabledWaves.includes('bottom') },

    topLineCount: { value: topLineCount },
    middleLineCount: { value: middleLineCount },
    bottomLineCount: { value: bottomLineCount },

    topLineDistance: { value: topLineDistance },
    middleLineDistance: { value: middleLineDistance },
    bottomLineDistance: { value: bottomLineDistance },

    topWavePosition: {
      value: new THREE.Vector3(topWavePosition?.x ?? 10.0, topWavePosition?.y ?? 0.5, topWavePosition?.rotate ?? -0.4)
    },
    middleWavePosition: {
      value: new THREE.Vector3(
        middleWavePosition?.x ?? 5.0,
        middleWavePosition?.y ?? 0.0,
        middleWavePosition?.rotate ?? 0.2
      )
    },
    bottomWavePosition: {
      value: new THREE.Vector3(
        bottomWavePosition?.x ?? 2.0,
        bottomWavePosition?.y ?? -0.7,
        bottomWavePosition?.rotate ?? 0.4
      )
    },

    iMouse: { value: new THREE.Vector2(-1000, -1000) },
    interactive: { value: interactive },
    bendRadius: { value: bendRadius },
    bendStrength: { value: bendStrength },
    bendInfluence: { value: 0 },

    parallax: { value: parallax },
    parallaxStrength: { value: parallaxStrength },
    parallaxOffset: { value: new THREE.Vector2(0, 0) },

    lineGradient: {
      value: Array.from({ length: 8 }, () => new THREE.Vector3(1, 1, 1))
    },
    lineGradientCount: { value: 0 }
  };

  const hexToVec3 = hex => {
    let value = hex.trim();
    if (value.startsWith('#')) {
      value = value.slice(1);
    }
    let r = 255, g = 255, b = 255;
    if (value.length === 3) {
      r = parseInt(value[0] + value[0], 16);
      g = parseInt(value[1] + value[1], 16);
      b = parseInt(value[2] + value[2], 16);
    } else if (value.length === 6) {
      r = parseInt(value.slice(0, 2), 16);
      g = parseInt(value.slice(2, 4), 16);
      b = parseInt(value.slice(4, 6), 16);
    }
    return new THREE.Vector3(r / 255, g / 255, b / 255);
  };

  if (linesGradient && linesGradient.length > 0) {
    const stops = linesGradient.slice(0, 8);
    uniforms.lineGradientCount.value = stops.length;
    stops.forEach((hex, i) => {
      const color = hexToVec3(hex);
      uniforms.lineGradient.value[i].set(color.x, color.y, color.z);
    });
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const clock = new THREE.Clock();

  const setSize = () => {
    if (!active) return;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    const canvasWidth = renderer.domElement.width;
    const canvasHeight = renderer.domElement.height;
    uniforms.iResolution.value.set(canvasWidth, canvasHeight, 1);
  };

  setSize();

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
    if (!active) return;
    setSize();
  }) : null;

  if (ro) ro.observe(container);

  const targetMouse = new THREE.Vector2(-1000, -1000);
  const currentMouse = new THREE.Vector2(-1000, -1000);
  const targetInfluence = { value: 0 };
  const currentInfluence = { value: 0 };
  const targetParallax = new THREE.Vector2(0, 0);
  const currentParallax = new THREE.Vector2(0, 0);

  const handlePointerMove = event => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dpr = renderer.getPixelRatio();
    targetMouse.set(x * dpr, (rect.height - y) * dpr);
    targetInfluence.value = 1.0;
    if (parallax) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = (x - centerX) / rect.width;
      const offsetY = -(y - centerY) / rect.height;
      targetParallax.set(offsetX * parallaxStrength, offsetY * parallaxStrength);
    }
  };

  const handlePointerLeave = () => {
    targetInfluence.value = 0.0;
  };

  if (interactive) {
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
  }

  let raf = 0;
  const renderLoop = () => {
    if (!active) return;
    uniforms.iTime.value = clock.getElapsedTime();
    if (interactive) {
      currentMouse.lerp(targetMouse, mouseDamping);
      uniforms.iMouse.value.copy(currentMouse);
      currentInfluence.value += (targetInfluence.value - currentInfluence.value) * mouseDamping;
      uniforms.bendInfluence.value = currentInfluence.value;
    }
    if (parallax) {
      currentParallax.lerp(targetParallax, mouseDamping);
      uniforms.parallaxOffset.value.copy(currentParallax);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  };
  renderLoop();

  return () => {
    active = false;
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    if (interactive) {
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
    }
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };
}

// Initialize FloatingLines on body
FloatingLines(document.body, {
  linesGradient: ['#add8e6', '#4b0082'], // Light blue to dark purple
  animationSpeed: 1,
  interactive: true
});
