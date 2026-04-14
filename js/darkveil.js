class DarkVeil {
  constructor(options = {}) {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.startTime = Date.now();
    
    // Parameters
    this.hueShift = options.hueShift || 0;
    this.noiseIntensity = options.noiseIntensity || 0.1;
    this.scanlineIntensity = options.scanlineIntensity || 0.05;
    this.speed = options.speed || 0.5;
    this.scanlineFrequency = options.scanlineFrequency || 50;
    this.warpAmount = options.warpAmount || 0.3;
    this.resolutionScale = options.resolutionScale || 1;
    
    this.init();
  }

  init() {
    const container = document.body;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'darkveil-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    `;
    container.insertBefore(this.canvas, container.firstChild);

    // Get WebGL context
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    this.createProgram();
    this.setupGeometry();
    this.resize();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
  }

  createProgram() {
    const vertexShader = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      #ifdef GL_ES
      precision highp float;
      #endif
      
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uHueShift;
      uniform float uNoise;
      uniform float uScan;
      uniform float uScanFreq;
      uniform float uWarp;
      
      float rand(vec2 c) {
        return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        fp = fp * fp * (3.0 - 2.0 * fp);
        
        float a = rand(ip);
        float b = rand(ip + vec2(1.0, 0.0));
        float c = rand(ip + vec2(0.0, 1.0));
        float d = rand(ip + vec2(1.0, 1.0));
        
        float ab = mix(a, b, fp.x);
        float cd = mix(c, d, fp.x);
        return mix(ab, cd, fp.y);
      }
      
      vec3 hueShift(vec3 col, float shift) {
        const vec3 k = vec3(0.57735, 0.57735, 0.57735);
        float cosA = cos(shift);
        return col * cosA + cross(k, col) * sin(shift) + k * dot(k, col) * (1.0 - cosA);
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 centered = uv * 2.0 - 1.0;
        centered.y *= -1.0;
        
        // Warp effect
        vec2 warp = vec2(
          sin(centered.y * 6.283 + uTime * 0.5),
          cos(centered.x * 6.283 + uTime * 0.5)
        ) * uWarp * 0.1;
        
        vec2 sampleUv = centered + warp;
        
        // Create flowing pattern
        float pattern = 0.0;
        pattern += sin(sampleUv.x * 3.0 + uTime * 0.3) * 0.5 + 0.5;
        pattern += sin(sampleUv.y * 2.0 + uTime * 0.2) * 0.5 + 0.5;
        pattern += noise(sampleUv * 2.0 + uTime * 0.1) * 0.5;
        pattern /= 3.0;
        
        // Base color with multiple layers
        vec3 col = vec3(0.0);
        
        // Purple gradient based on position
        float yGradient = (centered.y + 1.0) * 0.5;
        vec3 purpleBase = mix(vec3(0.1, 0.05, 0.2), vec3(0.5, 0.2, 0.8), yGradient);
        
        // Animated purple wave
        col += (purpleBase + vec3(0.3 + 0.2 * sin(uTime * 0.3 + sampleUv.y * 5.0), 
                                  0.1 + 0.15 * sin(uTime * 0.2 + sampleUv.x * 3.0),
                                  0.5 + 0.3 * sin(uTime * 0.25 + sampleUv.x * 2.0))) * pattern;
        
        // Add flowing purple pattern
        float flow = sin((sampleUv.x + sampleUv.y) * 4.0 - uTime * 2.0) * 0.5 + 0.5;
        col += vec3(flow * 0.2, flow * 0.08, flow * 0.4) * (1.0 - pattern);
        
        // Hue shift
        col = hueShift(col, radians(uHueShift));
        
        // Scanlines
        float scanline = sin(gl_FragCoord.y * uScanFreq) * 0.5 + 0.5;
        col *= 1.0 - (scanline * scanline) * uScan;
        
        // Noise
        col += (rand(gl_FragCoord.xy + uTime) - 0.5) * uNoise;
        
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;

    const vertexShaderObj = this.compileShader(vertexShader, this.gl.VERTEX_SHADER);
    const fragmentShaderObj = this.compileShader(fragmentShader, this.gl.FRAGMENT_SHADER);

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShaderObj);
    this.gl.attachShader(this.program, fragmentShaderObj);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program linking failed:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    this.gl.useProgram(this.program);

    // Setup uniforms
    this.uniforms.uResolution = this.gl.getUniformLocation(this.program, 'uResolution');
    this.uniforms.uTime = this.gl.getUniformLocation(this.program, 'uTime');
    this.uniforms.uHueShift = this.gl.getUniformLocation(this.program, 'uHueShift');
    this.uniforms.uNoise = this.gl.getUniformLocation(this.program, 'uNoise');
    this.uniforms.uScan = this.gl.getUniformLocation(this.program, 'uScan');
    this.uniforms.uScanFreq = this.gl.getUniformLocation(this.program, 'uScanFreq');
    this.uniforms.uWarp = this.gl.getUniformLocation(this.program, 'uWarp');
  }

  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  setupGeometry() {
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  resize() {
    const w = this.canvas.parentElement.clientWidth || window.innerWidth;
    const h = this.canvas.parentElement.clientHeight || window.innerHeight;
    
    this.canvas.width = w * this.resolutionScale;
    this.canvas.height = h * this.resolutionScale;
    
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.uniforms.uResolution, w, h);
  }

  animate = () => {
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    this.gl.uniform1f(this.uniforms.uTime, elapsed * this.speed);
    this.gl.uniform1f(this.uniforms.uHueShift, this.hueShift);
    this.gl.uniform1f(this.uniforms.uNoise, this.noiseIntensity);
    this.gl.uniform1f(this.uniforms.uScan, this.scanlineIntensity);
    this.gl.uniform1f(this.uniforms.uScanFreq, this.scanlineFrequency);
    this.gl.uniform1f(this.uniforms.uWarp, this.warpAmount);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.darkVeil = new DarkVeil({
      hueShift: 270,
      noiseIntensity: 0.03,
      scanlineIntensity: 0.04,
      speed: 0.3,
      scanlineFrequency: 40,
      warpAmount: 0.15,
      resolutionScale: 0.8
    });
  });
} else {
  window.darkVeil = new DarkVeil({
    hueShift: 270,
    noiseIntensity: 0.03,
    scanlineIntensity: 0.04,
    speed: 0.3,
    scanlineFrequency: 40,
    warpAmount: 0.15,
    resolutionScale: 0.8
  });
}
