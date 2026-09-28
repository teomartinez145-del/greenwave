document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     -1. PROJECTS DATA + GALLERY BUILD
     No depende de GSAP — corre siempre, incluso si el CDN falla.
  ========================================================= */
  const PROJECTS = [
    { title: 'Greenwave', image: 'images/project-greenwave.jpg' },
    { title: 'Kick Off', image: 'images/project-kickoff.jpg' },
    { title: 'GraphiXplore', image: 'images/project-graphixplore.jpg' },
    { title: 'Yale School of Art', image: 'images/project-yale-art.jpg' },
    { title: 'Oak Harbor Festival', image: 'images/project-oak-harbor.jpg' },
    { title: 'Movie Theater', image: 'images/project-movie-theater.jpg' }
  ];

  let currentLightboxIndex = null;

  function buildGalleryGrid() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    PROJECTS.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View ${item.title}`);
      card.dataset.index = String(index);

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title;
      img.className = 'project-image gallery-card__image';

      const overlay = document.createElement('div');
      overlay.className = 'gallery-card__overlay';
      overlay.innerHTML = `
        <span class="gallery-card__icon">&#128269;</span>
        <h3 class="gallery-card__title">${item.title}</h3>
      `;

      card.appendChild(img);
      card.appendChild(overlay);
      grid.appendChild(card);

      const open = () => {
        if (item.title === 'Kick Off') {
          window.open('kickoff.html', '_blank');
        } else if (item.title === 'Greenwave') {
          window.open('greenwave.html', '_blank');
        } else {
          openLightbox(index);
        }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function openLightbox(index) {
    currentLightboxIndex = index;
    const item = PROJECTS[index];
    const lightbox = document.getElementById('gallery-lightbox');
    const image = document.getElementById('gallery-lightbox-image');
    const title = document.getElementById('gallery-lightbox-title');
    if (!lightbox || !image || !title) return;

    image.src = item.image;
    image.alt = item.title;
    title.textContent = item.title;

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentLightboxIndex = null;
  }

  function stepLightbox(delta) {
    if (currentLightboxIndex === null) return;
    const next = (currentLightboxIndex + delta + PROJECTS.length) % PROJECTS.length;
    openLightbox(next);
  }

  function initGalleryLightbox() {
    buildGalleryGrid();

    const closeBtn = document.getElementById('gallery-lightbox-close');
    const backdrop = document.getElementById('gallery-lightbox-backdrop');
    const prevBtn = document.getElementById('gallery-lightbox-prev');
    const nextBtn = document.getElementById('gallery-lightbox-next');

    closeBtn?.addEventListener('click', closeLightbox);
    backdrop?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => stepLightbox(-1));
    nextBtn?.addEventListener('click', () => stepLightbox(1));

    document.addEventListener('keydown', (e) => {
      if (currentLightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    // Fade-in stagger para las tarjetas de la grilla al hacer scroll
    const cards = document.querySelectorAll('.gallery-card');
    if (!cards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((c) => c.classList.add('in-view'));
      return;
    }

    cards.forEach((card, i) => {
      card.style.transitionDelay = `${Math.min(i * 0.08, 0.4)}s`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => observer.observe(card));
  }

  initGalleryLightbox();

  /* =========================================================
     0. HERO — WarpText (WebGL glass-distortion text on the H1)
  ========================================================= */
  function initHeroWarpText() {
    const container = document.getElementById('hero-warp-text');
    if (!container || typeof window === 'undefined') return;

    const props = {
      text: 'Mateo Martinez',
      color: '#ffffff',
      fontSize: 'clamp(3.5rem, 11vw, 8.5rem)',
      fontWeight: 700,
      fontFamily: "'fireside', sans-serif",
      letterSpacing: '-0.03em',
      lineHeight: 0.9,
      warpStrength: 0.08,
      warpScale: 1.7,
      speed: 0.55,
      pointerInfluence: 0.42,
      pointerStrength: 0.38,
      refraction: 0.018,
      ripple: true
    };

    const getFontValue = (v) => (typeof v === 'number' ? `${v}px` : v);

    const measureLine = (ctx, line, letterSpacing) => {
      const chars = Array.from(line);
      const textWidth = chars.reduce((w, c) => w + ctx.measureText(c).width, 0);
      return textWidth + Math.max(0, chars.length - 1) * letterSpacing;
    };

    const drawLine = (ctx, line, x, y, letterSpacing) => {
      const chars = Array.from(line);
      let cursor = x - measureLine(ctx, line, letterSpacing) / 2;
      chars.forEach((char, i) => {
        ctx.fillText(char, cursor, y);
        cursor += ctx.measureText(char).width + (i === chars.length - 1 ? 0 : letterSpacing);
      });
    };

    const buildTextCanvas = ({ width, height, dpr }) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      const probe = document.createElement('span');
      probe.textContent = props.text;
      Object.assign(probe.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        whiteSpace: 'pre',
        inset: '0 auto auto 0',
        fontFamily: props.fontFamily,
        fontSize: getFontValue(props.fontSize),
        fontWeight: String(props.fontWeight),
        letterSpacing: getFontValue(props.letterSpacing),
        lineHeight: typeof props.lineHeight === 'number' ? String(props.lineHeight) : props.lineHeight
      });
      container.appendChild(probe);
      const computed = window.getComputedStyle(probe);
      let fontSizePx = parseFloat(computed.fontSize) || 96;
      const fontFamily = computed.fontFamily || 'sans-serif';
      const fontWeight = computed.fontWeight || String(props.fontWeight);
      let letterSpacing = computed.letterSpacing === 'normal' ? 0 : parseFloat(computed.letterSpacing) || 0;
      let lineHeight = parseFloat(computed.lineHeight);
      if (!Number.isFinite(lineHeight)) {
        lineHeight = fontSizePx * (typeof props.lineHeight === 'number' ? props.lineHeight : 0.92);
      }
      probe.remove();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = props.color;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const lines = String(props.text || '').split('\n');
      const applyFont = () => { ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`; };
      applyFont();

      const maxWidth = width * 0.86;
      const maxHeight = height * 0.78;
      const widest = Math.max(...lines.map((l) => measureLine(ctx, l, letterSpacing)), 1);
      const blockHeight = Math.max(lineHeight * lines.length, 1);
      const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

      if (fit < 1) {
        fontSizePx *= fit;
        letterSpacing *= fit;
        lineHeight *= fit;
        applyFont();
      }

      const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
      lines.forEach((line, i) => drawLine(ctx, line, width / 2, startY + i * lineHeight, letterSpacing));

      return canvas;
    };

    import('https://cdn.jsdelivr.net/npm/ogl@1/+esm')
      .then(({ Renderer, Program, Mesh, Triangle, Texture }) => {
        const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

        const fragment = `#version 300 es
precision highp float;
uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}
vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uTextTexture, uv);
}
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);
  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;
  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);
  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;
  vec2 displaced = uv + ambient + pointerWarp;
  vec2 splitDir = ambient + pointerWarp;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);
  vec4 base = sampleText(displaced);
  float r = sampleText(displaced + split).r;
  float g = base.g;
  float b = sampleText(displaced - split).b;
  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);
  vec3 color = vec3(r, g, b) + lens * base.a * 0.055;
  fragColor = vec4(color, a);
}`;

        let renderer, gl, program, geometry, mesh, texture;
        let raf = 0;
        let disposed = false;
        let contextLost = false;
        let visible = true;
        let pageVisible = !document.hidden;
        let reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        let rasterVersion = 0;

        const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 };
        const startTime = performance.now();

        try {
          renderer = new Renderer({
            webgl: 2,
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
            dpr: Math.min(window.devicePixelRatio || 1, 2)
          });
          gl = renderer.gl;
        } catch (error) {
          console.warn('WarpText: WebGL could not be initialized.', error);
          return;
        }

        gl.clearColor(0, 0, 0, 0);
        const canvas = gl.canvas;
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);

        texture = new Texture(gl, {
          generateMipmaps: false,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE
        });

        geometry = new Triangle(gl);
        program = new Program(gl, {
          vertex,
          fragment,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uTextTexture: { value: texture },
            uResolution: { value: new Float32Array([1, 1]) },
            uPointer: { value: new Float32Array([0.5, 0.5]) },
            uPointerActive: { value: 0 },
            uTime: { value: 0 },
            uWarpStrength: { value: props.warpStrength },
            uWarpScale: { value: props.warpScale },
            uSpeed: { value: props.speed },
            uPointerInfluence: { value: props.pointerInfluence },
            uPointerStrength: { value: props.pointerStrength },
            uRefraction: { value: props.refraction },
            uRipple: { value: props.ripple ? 1 : 0 },
            uMotion: { value: reduceMotion ? 0 : 1 }
          }
        });
        mesh = new Mesh(gl, { geometry, program });

        const renderOnce = () => {
          if (disposed || contextLost) return;
          renderer.render({ scene: mesh });
        };

        const rasterize = async () => {
          const version = ++rasterVersion;
          if (document.fonts?.ready) {
            try { await document.fonts.ready; } catch {}
          }
          if (disposed || contextLost || version !== rasterVersion) return;

          const rect = container.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const textCanvas = buildTextCanvas({ width: rect.width, height: rect.height, dpr });
          texture.image = textCanvas;
          texture.needsUpdate = true;
          renderOnce();
        };

        const resize = () => {
          if (disposed || contextLost) return;
          const rect = container.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;

          renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
          renderer.setSize(rect.width, rect.height);
          program.uniforms.uResolution.value[0] = gl.drawingBufferWidth;
          program.uniforms.uResolution.value[1] = gl.drawingBufferHeight;
          rasterize();
        };

        const onPointerMove = (event) => {
          if (event.pointerType === 'touch') return;
          const rect = canvas.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          pointer.tx = (event.clientX - rect.left) / rect.width;
          pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
          pointer.activeTarget = 1;
        };

        const onPointerLeave = () => { pointer.activeTarget = 0; };

        const onContextLost = (event) => {
          event.preventDefault();
          contextLost = true;
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        };

        const onVisibility = () => {
          pageVisible = !document.hidden;
          if (pageVisible && visible && !raf) raf = requestAnimationFrame(loop);
          if (!pageVisible && raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        };

        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        const onReducedMotion = (event) => {
          reduceMotion = event.matches;
          program.uniforms.uMotion.value = reduceMotion ? 0 : 1;
          renderOnce();
        };

        const loop = (now) => {
          if (disposed || contextLost) return;

          const elapsed = (now - startTime) * 0.001;
          const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12;
          const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1;
          const targetX = pointer.activeTarget > 0 ? pointer.tx : idleX;
          const targetY = pointer.activeTarget > 0 ? pointer.ty : idleY;
          const damping = pointer.activeTarget > 0 ? 0.12 : 0.035;

          pointer.x += (targetX - pointer.x) * damping;
          pointer.y += (targetY - pointer.y) * damping;
          pointer.active += ((pointer.activeTarget > 0 ? 1 : 0.18) - pointer.active) * 0.06;

          program.uniforms.uPointer.value[0] = pointer.x;
          program.uniforms.uPointer.value[1] = pointer.y;
          program.uniforms.uPointerActive.value = reduceMotion ? pointer.active * 0.35 : pointer.active;
          program.uniforms.uTime.value = reduceMotion ? 0 : elapsed;

          renderOnce();
          raf = requestAnimationFrame(loop);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        const intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible && pageVisible && !raf) raf = requestAnimationFrame(loop);
            if (!visible && raf) {
              cancelAnimationFrame(raf);
              raf = 0;
            }
          },
          { threshold: 0 }
        );
        intersectionObserver.observe(container);

        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerleave', onPointerLeave);
        canvas.addEventListener('webglcontextlost', onContextLost, false);
        document.addEventListener('visibilitychange', onVisibility);
        mediaQuery?.addEventListener('change', onReducedMotion);

        resize();
        raf = requestAnimationFrame(loop);
      })
      .catch((error) => {
        console.warn('WarpText: failed to load ogl, showing plain text fallback.', error);
        container.textContent = props.text;
        container.style.color = props.color;
        container.style.fontFamily = props.fontFamily;
        container.style.fontWeight = String(props.fontWeight);
        container.style.fontSize = getFontValue(props.fontSize);
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
      });
  }

  initHeroWarpText();

  /* =========================================================
     1. IMAGE FALLBACKS
  ========================================================= */
  const BRAND_COLORS = {
    'adobe illustrator': { bg: '#FF9A00', label: 'Ai' },
    'adobe indesign': { bg: '#FF3366', label: 'Id' },
    'adobe photoshop': { bg: '#31A8FF', label: 'Ps' },
    'adobe premiere pro': { bg: '#9999FF', label: 'Pr' },
    'adobe after effects': { bg: '#9999FF', label: 'Ae' },
    'adobe lightroom': { bg: '#31A8FF', label: 'Lr' },
    'figma': { bg: '#1E1E1E', label: 'Fg' },
    'microsoft powerpoint': { bg: '#D24726', label: 'Pp' },
    'microsoft word': { bg: '#2B579A', label: 'W' }
  };

  function applyIconFallback(img) {
    const key = (img.alt || '').trim().toLowerCase();
    const brand = BRAND_COLORS[key] || { bg: '#0d0d0d', label: (img.alt || '?').slice(0, 2) };

    const badge = document.createElement('div');
    badge.className = 'icon-fallback';
    badge.style.backgroundColor = brand.bg;
    badge.textContent = brand.label;
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', img.alt || 'icon');

    img.replaceWith(badge);
  }

  function applyLogoFallback(img) {
    const span = document.createElement('span');
    span.className = 'logo-fallback';
    span.textContent = document.title.split('|')[0].trim() || 'Logo';
    img.replaceWith(span);
  }

  function applyImageFallback(img, message) {
    const div = document.createElement('div');
    div.className = 'image-fallback';
    div.textContent = message;
    img.replaceWith(div);
  }

  function watchImage(img, onError) {
    if (img.complete && img.naturalWidth === 0) {
      onError();
      return;
    }
    img.addEventListener('error', onError, { once: true });
  }

  document.querySelectorAll('.skill-icon').forEach((img) => watchImage(img, () => applyIconFallback(img)));

  const logoImg = document.querySelector('.logo-img');
  if (logoImg) watchImage(logoImg, () => applyLogoFallback(logoImg));

  const profilePhotoImg = document.querySelector('.profile-photo');
  if (profilePhotoImg) watchImage(profilePhotoImg, () => applyImageFallback(profilePhotoImg, 'Photo coming soon'));

  document.querySelectorAll('.project-image').forEach((img) => {
    watchImage(img, () => applyImageFallback(img, img.alt || 'Project image coming soon'));
  });

  /* =========================================================
     2. Active nav link
  ========================================================= */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle('nav-link--active', link.getAttribute('href') === id);
          });
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* =========================================================
     3. GSAP-powered effects
  ========================================================= */
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  if (prefersReducedMotion) return;

  function initSkillTagPillHover() {
    const ease = 'power3.out';

    const tags = Array.from(document.querySelectorAll('.skill-tag')).filter(
      (tag) => !tag.querySelector('.skill-icon')
    );
    if (!tags.length) return;

    const circles = [];
    const timelines = [];
    const activeTweens = [];

    tags.forEach((tag, i) => {
      const text = tag.textContent.trim();
      tag.textContent = '';
      tag.classList.add('skill-tag--pill-init');

      const circle = document.createElement('span');
      circle.className = 'skill-hover-circle';
      circle.setAttribute('aria-hidden', 'true');

      const stack = document.createElement('span');
      stack.className = 'skill-label-stack';

      const label = document.createElement('span');
      label.className = 'skill-label';
      label.textContent = text;

      const hoverLabel = document.createElement('span');
      hoverLabel.className = 'skill-label-hover';
      hoverLabel.setAttribute('aria-hidden', 'true');
      hoverLabel.textContent = text;

      stack.appendChild(label);
      stack.appendChild(hoverLabel);
      tag.appendChild(circle);
      tag.appendChild(stack);

      circles[i] = circle;
      tag._skillLabel = label;
      tag._skillHoverLabel = hoverLabel;
    });

    function layout() {
      tags.forEach((tag, i) => {
        const circle = circles[i];
        if (!circle) return;

        const rect = tag.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const R = (w * w / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
        gsap.set(tag._skillLabel, { y: 0 });
        gsap.set(tag._skillHoverLabel, { y: h + 12, opacity: 0 });

        timelines[i]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);
        tl.to(tag._skillLabel, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        gsap.set(tag._skillHoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
        tl.to(tag._skillHoverLabel, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        timelines[i] = tl;
      });
    }

    layout();

    tags.forEach((tag, i) => {
      tag.addEventListener('pointerenter', () => {
        const tl = timelines[i];
        if (!tl) return;
        activeTweens[i]?.kill();
        activeTweens[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
      });
      tag.addEventListener('pointerleave', () => {
        const tl = timelines[i];
        if (!tl) return;
        activeTweens[i]?.kill();
        activeTweens[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
      });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }
  }

  initSkillTagPillHover();

  /* ---------- 3c. About Me text — line-by-line block reveal (adapted from TextBlockAnimation) ---------- */
  function initAboutTextBlockReveal() {
    const paragraphs = document.querySelectorAll('.about-intro .about-text');
    if (!paragraphs.length) return;

    const config = {
      blockColor: '#5DA9E9',
      stagger: 0.1,
      duration: 0.6,
      delay: 0
    };

    function splitIntoLines(el) {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';

      const wordSpans = words.map((word, i) => {
        const span = document.createElement('span');
        span.textContent = word + (i < words.length - 1 ? '\u00A0' : '');
        span.style.display = 'inline-block';
        el.appendChild(span);
        return span;
      });

      const lineGroups = [];
      let currentTop = null;
      wordSpans.forEach((span) => {
        const top = span.offsetTop;
        if (currentTop === null || Math.abs(top - currentTop) > 2) {
          lineGroups.push([]);
          currentTop = top;
        }
        lineGroups[lineGroups.length - 1].push(span.textContent);
      });

      el.textContent = '';

      const lineEls = lineGroups.map((words) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'tba-line-wrapper';

        const lineText = document.createElement('span');
        lineText.className = 'tba-line-text';
        lineText.textContent = words.join('');

        const block = document.createElement('div');
        block.className = 'tba-block';
        block.style.backgroundColor = config.blockColor;

        wrapper.appendChild(lineText);
        wrapper.appendChild(block);
        el.appendChild(wrapper);

        return { lineText, block };
      });

      return lineEls;
    }

    function build() {
      paragraphs.forEach((p) => {
        const lines = splitIntoLines(p);
        if (!lines.length) return;

        const blocks = lines.map((l) => l.block);
        const texts = lines.map((l) => l.lineText);

        const tl = gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          delay: config.delay,
          scrollTrigger: {
            trigger: p,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });

        tl.to(blocks, {
          scaleX: 1,
          duration: config.duration,
          stagger: config.stagger,
          transformOrigin: 'left center'
        })
          .set(texts, { opacity: 1, stagger: config.stagger }, `<${config.duration / 2}`)
          .to(blocks, {
            scaleX: 0,
            duration: config.duration,
            stagger: config.stagger,
            transformOrigin: 'right center'
          }, `<${config.duration / 2}`);
      });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(build).catch(build);
    } else {
      build();
    }
  }

  initAboutTextBlockReveal();

  /* ---------- 3b. About photo parallax ---------- */
  const profilePhoto = document.querySelector('.profile-photo, .image-fallback');
  const aboutImage = document.querySelector('.about-image');

  if (profilePhoto && aboutImage && profilePhoto.tagName === 'IMG') {
    const mask = document.createElement('div');
    mask.className = 'photo-mask';
    aboutImage.insertBefore(mask, profilePhoto);
    mask.appendChild(profilePhoto);

    gsap.fromTo(
      profilePhoto,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: aboutImage,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }
});