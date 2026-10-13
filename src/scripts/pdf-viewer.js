// scripts/pdf-viewer.js
//
// A small pdf.js-based viewer for the book reader.
//
// Why not just an <iframe>: mobile browsers — iOS Safari above all — either
// refuse to display a PDF inside a frame or hand it to a separate viewer app,
// so members on a phone could not read most of the library. Rendering the pages
// ourselves works everywhere, and brings real page counts, zoom and a reading
// position we can save.
//
// pdf.js is loaded from /pdfjs as a plain ES module on first use, so it never
// lands in the dashboard bundle and only costs anything once someone opens a
// book.

// Kept in a variable so the bundler leaves this import alone: the target is a
// static file in public/, not a package to resolve at build time.
// Served as .js rather than .mjs: nginx has no mjs MIME mapping, so an .mjs
// file arrives as application/octet-stream and module loading fails outright.
const PDFJS_LIB = '/pdfjs/pdf.min.js';
const PDFJS_WORKER = '/pdfjs/pdf.worker.js';

let pdfjsPromise = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* @vite-ignore */ PDFJS_LIB)
      .then(mod => {
        mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return mod;
      })
      .catch(err => {
        pdfjsPromise = null; // allow a retry on the next attempt
        throw err;
      });
  }
  return pdfjsPromise;
}

/** True when we can render PDFs ourselves in this browser. */
export async function pdfViewerSupported() {
  try {
    await loadPdfJs();
    return true;
  } catch {
    return false;
  }
}

/**
 * Render a PDF into `container`.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.container  scrollable element the pages go into
 * @param {string} opts.url             same-origin URL of the PDF
 * @param {number} [opts.startPage]     page to scroll to first
 * @param {(p:{page:number,total:number})=>void} [opts.onProgress]
 * @returns {Promise<object>} an API for the reader toolbar
 */
export async function openPdfViewer({ container, url, startPage = 1, onProgress }) {
  const pdfjs = await loadPdfJs();

  const doc = await pdfjs.getDocument({
    url,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    wasmUrl: '/pdfjs/wasm/',
  }).promise;

  const total = doc.numPages;

  // Keep every page box in the DOM at the right size from the start so the
  // scroll height is correct immediately and pages don't shove each other
  // around as they render.
  const firstPage = await doc.getPage(1);
  const base = firstPage.getViewport({ scale: 1 });

  const pagesEl = document.createElement('div');
  pagesEl.id = 'pdf-pages';
  pagesEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0 60px;';

  const state = {
    zoom: 1,          // multiplier on top of fit-width
    dpr: Math.min(window.devicePixelRatio || 1, 2.5),
    current: 1,
    rendered: new Map(),  // page number → canvas
    boxes: new Map(),     // page number → wrapper element
  };

  /** Width available to a page, in CSS pixels. */
  function availableWidth() {
    return Math.max(240, container.clientWidth - 20);
  }

  function scaleFor(pageViewport) {
    return (availableWidth() / pageViewport.width) * state.zoom;
  }

  // Build one placeholder box per page, sized from page 1's aspect ratio (a
  // good approximation; corrected as each page is actually laid out).
  const boxHeights = [];
  {
    let y = 0;
    for (let n = 1; n <= total; n++) {
      const w = availableWidth();
      const h = Math.round((base.height / base.width) * w);
      const box = document.createElement('div');
      box.dataset.page = String(n);
      box.style.cssText = `width:${w}px;height:${h}px;background:rgba(128,128,128,0.08);border-radius:4px;flex-shrink:0;`;
      boxHeights.push(h);
      pagesEl.appendChild(box);
      state.boxes.set(n, box);
      y += h;
    }
    void y;
  }

  container.innerHTML = '';
  container.appendChild(pagesEl);

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const n = Number(entry.target.dataset.page);
      if (entry.isIntersecting) renderPage(n);
      else if (state.rendered.has(n) && Math.abs(n - state.current) > 3) releasePage(n);
    }
  }, { root: container, rootMargin: '800px 0px' });

  for (const box of state.boxes.values()) observer.observe(box);

  async function renderPage(n) {
    if (state.rendered.has(n) || n < 1 || n > total) return;
    const box = state.boxes.get(n);
    if (!box || box.dataset.rendering === '1') return;
    box.dataset.rendering = '1';

    try {
      const page = await doc.getPage(n);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = scaleFor(unscaled);
      const viewport = page.getViewport({ scale: scale * state.dpr });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.cssText = `width:${Math.floor(viewport.width / state.dpr)}px;height:${Math.floor(viewport.height / state.dpr)}px;display:block;border-radius:4px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,0.12);`;

      const ctx = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: ctx, viewport }).promise;

      box.style.height = `${Math.floor(viewport.height / state.dpr)}px`;
      box.style.background = 'transparent';
      box.innerHTML = '';
      box.appendChild(canvas);
      state.rendered.set(n, canvas);
    } catch (err) {
      box.innerHTML = `<div style="padding:24px;text-align:center;font-size:12px;opacity:0.6;">Page ${n} could not be displayed</div>`;
    } finally {
      box.dataset.rendering = '0';
    }
  }

  /** Drop a page's canvas to bound memory on long documents. */
  function releasePage(n) {
    const canvas = state.rendered.get(n);
    const box = state.boxes.get(n);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (box) {
      box.innerHTML = '';
      box.style.background = 'rgba(128,128,128,0.08)';
    }
    state.rendered.delete(n);
  }

  /** Which page is at the top of the viewport. */
  function measureCurrent() {
    const top = container.scrollTop;
    let best = 1;
    for (let n = 1; n <= total; n++) {
      const box = state.boxes.get(n);
      if (!box) continue;
      if (box.offsetTop - 60 <= top) best = n;
      else break;
    }
    return best;
  }

  function report() {
    if (onProgress) onProgress({ page: state.current, total });
  }

  function onScroll() {
    const n = measureCurrent();
    if (n !== state.current) {
      state.current = n;
      report();
    }
  }
  container.addEventListener('scroll', onScroll, { passive: true });

  function goToPage(n) {
    const target = Math.min(total, Math.max(1, n));
    const box = state.boxes.get(target);
    if (box) container.scrollTop = box.offsetTop - 6;
    state.current = target;
    report();
  }

  /** Apply a new zoom level to every page box and re-render what's visible. */
  function applyZoom() {
    const w = availableWidth();
    for (let n = 1; n <= total; n++) {
      const box = state.boxes.get(n);
      if (!box) continue;
      const h = Math.round((base.height / base.width) * w);
      box.style.width = `${w}px`;
      if (!state.rendered.has(n)) box.style.height = `${h}px`;
      if (state.rendered.has(n)) releasePage(n);
    }
    void w;
    // Re-render the page in view and its neighbours.
    for (let n = Math.max(1, state.current - 1); n <= Math.min(total, state.current + 1); n++) {
      renderPage(n);
    }
  }

  // Start where the reader left off.
  if (startPage > 1 && startPage <= total) {
    requestAnimationFrame(() => goToPage(startPage));
  } else {
    state.current = 1;
  }
  report();

  // Re-render on resize so the page keeps filling the width (orientation change
  // is common on phones).
  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { applyZoom(); }, 300);
  };
  window.addEventListener('resize', onResize);

  return {
    total,
    get current() { return state.current; },
    goToPage,
    nextPage: () => goToPage(state.current + 1),
    prevPage: () => goToPage(state.current - 1),
    zoomIn: () => { state.zoom = Math.min(3, state.zoom + 0.25); applyZoom(); report(); },
    zoomOut: () => { state.zoom = Math.max(0.5, state.zoom - 0.25); applyZoom(); report(); },
    fitWidth: () => { state.zoom = 1; applyZoom(); report(); },
    destroy() {
      observer.disconnect();
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      state.rendered.forEach((canvas, n) => releasePage(n));
      pagesEl.remove();
      doc.destroy().catch(() => {});
    },
  };
}
