(() => {
  'use strict';

  const STORAGE_KEY = 'disenador_codigo_powerpoint_v1';
  const GRID_SIZE = 10;
  const MIN_SIZE = 10;
  const MIN_CANVAS_SIZE = 100;

  const canvas = document.getElementById('canvas');
  const canvasViewport = document.getElementById('canvasViewport');
  const canvasScroller = document.getElementById('canvasScroller');
  const layersList = document.getElementById('layersList');
  const toast = document.getElementById('toast');

  const state = {
    canvas: { width: 1280, height: 720, preset: 'desktop', background: '#ffffff' },
    elements: [],
    selectedIds: [],
    activeId: null,
    zoom: 0.85,
    grid: true,
    snap: true,
    drag: null,
    editingId: null,
    lastEditClick: null,
    activeTableCell: null,
    tableSelectionAnchor: null,
    tableSelectionRange: null,
    clipboard: [],
    history: [],
    historyIndex: -1,
    historyTimer: null,
    initialized: false
  };

  const props = {
    name: document.getElementById('propName'),
    content: document.getElementById('propContent'),
    url: document.getElementById('propUrl'),
    icon: document.getElementById('propIcon'),
    x: document.getElementById('propX'),
    y: document.getElementById('propY'),
    width: document.getElementById('propWidth'),
    height: document.getElementById('propHeight'),
    rotation: document.getElementById('propRotation'),
    bg: document.getElementById('propBg'),
    bgPicker: document.getElementById('propBgPicker'),
    color: document.getElementById('propColor'),
    colorPicker: document.getElementById('propColorPicker'),
    borderColor: document.getElementById('propBorderColor'),
    borderPicker: document.getElementById('propBorderPicker'),
    borderWidth: document.getElementById('propBorderWidth'),
    radius: document.getElementById('propRadius'),
    opacity: document.getElementById('propOpacity'),
    padding: document.getElementById('propPadding'),
    shadow: document.getElementById('propShadow'),
    fontFamily: document.getElementById('propFontFamily'),
    fontSize: document.getElementById('propFontSize'),
    fontWeight: document.getElementById('propFontWeight'),
    textAlign: document.getElementById('propTextAlign'),
    lineHeight: document.getElementById('propLineHeight'),
    letterSpacing: document.getElementById('propLetterSpacing'),
    italic: document.getElementById('propItalic'),
    objectFit: document.getElementById('propObjectFit'),
    linkPreset: document.getElementById('propLinkPreset'),
    linkDecoration: document.getElementById('propLinkDecoration'),
    linkTarget: document.getElementById('propLinkTarget')
  };

  const TYPE_META = {
    heading: { label: 'Título', icon: 'bi-type-h1', tag: 'h1', text: true },
    text: { label: 'Texto', icon: 'bi-text-paragraph', tag: 'p', text: true },
    link: { label: 'Enlace', icon: 'bi-link-45deg', tag: 'a', text: true },
    button: { label: 'Botón', icon: 'bi-cursor-fill', tag: 'a', text: true },
    image: { label: 'Imagen', icon: 'bi-image', tag: 'img', text: false },
    icon: { label: 'Ícono', icon: 'bi-star-fill', tag: 'i', text: false },
    badge: { label: 'Etiqueta', icon: 'bi-bookmark-star-fill', tag: 'span', text: true },
    card: { label: 'Tarjeta', icon: 'bi-card-text', tag: 'div', text: true },
    alert: { label: 'Alerta', icon: 'bi-info-circle-fill', tag: 'div', text: true },
    navbar: { label: 'Navbar', icon: 'bi-menu-button-wide', tag: 'nav', text: false },
    hero: { label: 'Hero', icon: 'bi-stars', tag: 'section', text: true },
    table: { label: 'Tabla', icon: 'bi-table', tag: 'table', text: false },
    list: { label: 'Lista', icon: 'bi-list-ul', tag: 'ul', text: true },
    form: { label: 'Formulario', icon: 'bi-ui-checks', tag: 'form', text: false },
    input: { label: 'Input', icon: 'bi-input-cursor-text', tag: 'input', text: false },
    textarea: { label: 'Textarea', icon: 'bi-textarea-t', tag: 'textarea', text: false },
    select: { label: 'Select', icon: 'bi-menu-down', tag: 'select', text: false },
    checkbox: { label: 'Checkbox', icon: 'bi-check-square', tag: 'label', text: true },
    progress: { label: 'Progreso', icon: 'bi-bar-chart-line', tag: 'div', text: false },
    video: { label: 'Video', icon: 'bi-play-btn', tag: 'iframe', text: false },
    divider: { label: 'Separador', icon: 'bi-dash-lg', tag: 'div', text: false },
    container: { label: 'Contenedor', icon: 'bi-square', tag: 'div', text: false },
    line: { label: 'Línea', icon: 'bi-slash-lg', tag: 'div', text: false },
    rectangle: { label: 'Rectángulo', icon: 'bi-square-fill', tag: 'div', text: false },
    circle: { label: 'Círculo', icon: 'bi-circle-fill', tag: 'div', text: false },
    glass: { label: 'Glass card', icon: 'bi-window-stack', tag: 'div', text: true },
    stat: { label: 'Estadística', icon: 'bi-graph-up-arrow', tag: 'div', text: true },
    pricing: { label: 'Pricing', icon: 'bi-credit-card', tag: 'div', text: true },
    quote: { label: 'Testimonio', icon: 'bi-quote', tag: 'blockquote', text: true },
    feature: { label: 'Feature', icon: 'bi-lightning-charge', tag: 'div', text: true },
    timeline: { label: 'Timeline', icon: 'bi-diagram-3', tag: 'div', text: true },
    mockup: { label: 'Mockup', icon: 'bi-window-desktop', tag: 'div', text: true },
    notification: { label: 'Notificación', icon: 'bi-bell', tag: 'div', text: true },
    avatarGroup: { label: 'Avatares', icon: 'bi-people-fill', tag: 'div', text: false },
    gradientPanel: { label: 'Panel gradiente', icon: 'bi-palette', tag: 'div', text: true }
  };

  function uid() {
    return 'el_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cleanNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function roundCanvasSize(value) {
    return Math.max(MIN_CANVAS_SIZE, Math.ceil(value / GRID_SIZE) * GRID_SIZE);
  }

  function snap(value) {
    return state.snap ? Math.round(value / GRID_SIZE) * GRID_SIZE : Math.round(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeHex(value, fallback) {
    const text = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
  }

  function cleanHexInput(value, fallback) {
    let text = String(value || '').trim();
    if (!text) return fallback;
    if (text.charAt(0) !== '#') text = '#' + text;
    if (/^#[0-9a-fA-F]{3}$/.test(text)) {
      text = '#' + text.slice(1).split('').map(function (char) { return char + char; }).join('');
    }
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toUpperCase() : fallback;
  }

  function shadowValue(level) {
    const map = {
      none: 'none',
      soft: '0 6px 16px rgba(15, 23, 42, 0.12)',
      medium: '0 12px 26px rgba(15, 23, 42, 0.18)',
      strong: '0 18px 40px rgba(15, 23, 42, 0.26)'
    };
    return map[level] || 'none';
  }

  function tableCell(text) {
    return { text: String(text || ''), style: {} };
  }

  function normalizeTableCellStyle(style) {
    style = style && typeof style === 'object' ? style : {};
    return {
      fontSize: style.fontSize ? Math.max(1, cleanNumber(style.fontSize, 14)) : '',
      fontFamily: style.fontFamily || '',
      color: style.color || '',
      backgroundColor: style.backgroundColor || '',
      fontWeight: style.fontWeight || '',
      textAlign: style.textAlign || ''
    };
  }

  function makeElement(type, x, y) {
    const base = {
      id: uid(),
      type,
      name: TYPE_META[type].label,
      x: snap(x),
      y: snap(y),
      width: 220,
      height: 60,
      rotation: 0,
      visible: true,
      locked: false,
      content: '',
      attrs: {},
      style: {
        backgroundColor: 'transparent',
        color: '#1f2937',
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        opacity: 100,
        padding: '0px',
        shadow: 'none',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fontWeight: '400',
        textAlign: 'left',
        lineHeight: 1.35,
        letterSpacing: 0,
        fontStyle: 'normal',
        textDecoration: '',
        objectFit: 'cover'
      }
    };

    const variants = {
      heading: { width: 470, height: 80, content: 'Diseña sin límites', style: { fontSize: 44, fontWeight: '700', lineHeight: 1.08 } },
      text: { width: 400, height: 92, content: 'Agrega, mueve y transforma cada elemento como en una presentación.', style: { fontSize: 17, color: '#667085', lineHeight: 1.5 } },
      link: { width: 180, height: 32, content: 'Enlace de ejemplo', attrs: { href: 'https://www.ejemplo.com', targetBlank: true, linkPreset: 'normal' }, style: { color: '#2563eb', fontSize: 16, fontWeight: '600', textAlign: 'left', textDecoration: 'underline' } },
      button: { width: 160, height: 46, content: 'Comenzar ahora', attrs: { href: '#', className: 'btn btn-primary' }, style: { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: 8, padding: '10px 18px', fontSize: 15, fontWeight: '600', textAlign: 'center' } },
      image: { width: 340, height: 230, attrs: { src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', alt: 'Imagen de ejemplo' }, style: { borderRadius: 14, objectFit: 'cover' } },
      icon: { width: 64, height: 64, attrs: { icon: 'bi-star-fill' }, style: { color: '#2563eb', fontSize: 38, textAlign: 'center' } },
      badge: { width: 135, height: 30, content: 'NOVEDAD', attrs: { className: 'badge badge-primary' }, style: { backgroundColor: '#e7f0ff', color: '#1d5ac6', borderRadius: 16, padding: '7px 12px', fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.8 } },
      card: { width: 300, height: 170, content: 'Tarjeta informativa', attrs: { className: 'card' }, style: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, padding: '24px', fontSize: 19, fontWeight: '700', shadow: 'soft' } },
      alert: { width: 360, height: 58, content: 'Esta es una alerta informativa.', attrs: { className: 'alert alert-info' }, style: { backgroundColor: '#eaf6ff', color: '#135b89', borderColor: '#b8e0fa', borderWidth: 1, borderRadius: 8, padding: '15px 17px', fontSize: 14 } },
      navbar: { width: 720, height: 64, content: 'Mi sitio', attrs: { className: 'navbar navbar-expand navbar-light bg-light', items: ['Inicio', 'Servicios', 'Contacto'] }, style: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: '700', shadow: 'soft' } },
      hero: { width: 680, height: 260, content: 'Construye experiencias digitales\nCrea una sección principal con título, descripción y llamada a la acción.', attrs: { className: 'jumbotron' }, style: { backgroundColor: '#eff6ff', color: '#172033', borderRadius: 18, padding: '42px', fontSize: 30, fontWeight: '800', lineHeight: 1.18, shadow: 'soft' } },
      table: { width: 430, height: 180, attrs: { className: 'table table-bordered table-sm', cells: [[tableCell('Producto'), tableCell('Cantidad'), tableCell('Precio')], [tableCell('Servicio web'), tableCell('1'), tableCell('$120')], [tableCell('Soporte'), tableCell('3'), tableCell('$45')]] }, style: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#cfd7e2', borderWidth: 1, borderRadius: 8, padding: '0px', fontSize: 14, shadow: 'soft' } },
      list: { width: 300, height: 132, content: 'Primer beneficio\nSegundo beneficio\nTercer beneficio', attrs: { className: 'list-group' }, style: { backgroundColor: '#ffffff', color: '#334155', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 10, padding: '12px 18px', fontSize: 15, lineHeight: 1.7 } },
      form: { width: 360, height: 230, attrs: { className: 'p-3 border rounded', fields: ['Nombre', 'Correo', 'Mensaje'] }, style: { backgroundColor: '#ffffff', color: '#334155', borderColor: '#d8e0eb', borderWidth: 1, borderRadius: 12, padding: '18px', fontSize: 14, shadow: 'soft' } },
      input: { width: 280, height: 42, attrs: { placeholder: 'Escribe aquí...', type: 'text', className: 'form-control' }, style: { backgroundColor: '#ffffff', color: '#495057', borderColor: '#cfd7e2', borderWidth: 1, borderRadius: 6, padding: '8px 12px', fontSize: 14 } },
      textarea: { width: 320, height: 110, attrs: { placeholder: 'Mensaje...', className: 'form-control' }, style: { backgroundColor: '#ffffff', color: '#495057', borderColor: '#cfd7e2', borderWidth: 1, borderRadius: 8, padding: '10px 12px', fontSize: 14 } },
      select: { width: 260, height: 42, attrs: { className: 'form-control', options: ['Selecciona una opción', 'Opción A', 'Opción B'] }, style: { backgroundColor: '#ffffff', color: '#495057', borderColor: '#cfd7e2', borderWidth: 1, borderRadius: 6, padding: '8px 12px', fontSize: 14 } },
      checkbox: { width: 220, height: 34, content: 'Acepto los términos', style: { backgroundColor: 'transparent', color: '#334155', fontSize: 14, fontWeight: '600' } },
      progress: { width: 340, height: 26, attrs: { value: 65, className: 'progress' }, style: { backgroundColor: '#e5e7eb', color: '#2563eb', borderRadius: 999 } },
      video: { width: 420, height: 236, attrs: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Video' }, style: { backgroundColor: '#0f172a', borderRadius: 12, shadow: 'soft' } },
      divider: { width: 320, height: 2, style: { backgroundColor: '#d8e0ea' } },
      container: { width: 380, height: 220, style: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 12, shadow: 'soft' } },
      line: { width: 260, height: 3, style: { backgroundColor: '#334155', borderRadius: 2 } },
      rectangle: { width: 180, height: 120, style: { backgroundColor: '#3b82f6', borderRadius: 6 } },
      circle: { width: 130, height: 130, style: { backgroundColor: '#8b5cf6', borderRadius: 999 } },
      glass: { width: 320, height: 190, content: 'Glass card\nSuperficie translúcida para destacar contenido.', style: { backgroundColor: 'rgba(255,255,255,.72)', color: '#172033', borderColor: 'rgba(255,255,255,.75)', borderWidth: 1, borderRadius: 22, padding: '26px', fontSize: 18, fontWeight: '700', lineHeight: 1.45, shadow: 'strong' } },
      stat: { width: 250, height: 140, content: '+128%\nCrecimiento mensual', style: { backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 18, padding: '24px', fontSize: 32, fontWeight: '800', lineHeight: 1.25, shadow: 'medium' } },
      pricing: { width: 300, height: 250, content: 'Plan Pro\n$29/mes\nIncluye componentes premium, exportación y soporte.', attrs: { className: 'card' }, style: { backgroundColor: '#ffffff', color: '#111827', borderColor: '#dbe4f0', borderWidth: 1, borderRadius: 18, padding: '28px', fontSize: 20, fontWeight: '800', lineHeight: 1.45, shadow: 'medium' } },
      quote: { width: 380, height: 160, content: '“El editor nos permitió prototipar más rápido.”\nAna Torres, Producto', style: { backgroundColor: '#fff7ed', color: '#7c2d12', borderColor: '#fed7aa', borderWidth: 1, borderRadius: 18, padding: '26px', fontSize: 18, fontWeight: '700', lineHeight: 1.45, shadow: 'soft' } },
      feature: { width: 320, height: 170, content: '⚡ Automatización\nReduce tareas repetitivas con flujos visuales.', style: { backgroundColor: '#eef2ff', color: '#312e81', borderColor: '#c7d2fe', borderWidth: 1, borderRadius: 18, padding: '24px', fontSize: 18, fontWeight: '800', lineHeight: 1.45, shadow: 'soft' } },
      timeline: { width: 360, height: 210, content: '01 Investigación\n02 Diseño visual\n03 Publicación', style: { backgroundColor: '#ffffff', color: '#334155', borderColor: '#d8e0eb', borderWidth: 1, borderRadius: 18, padding: '24px 28px', fontSize: 16, fontWeight: '700', lineHeight: 1.9, shadow: 'soft' } },
      mockup: { width: 420, height: 250, content: 'Vista previa del producto', style: { backgroundColor: '#111827', color: '#e5e7eb', borderRadius: 18, padding: '34px', fontSize: 18, fontWeight: '700', textAlign: 'center', shadow: 'strong' } },
      notification: { width: 340, height: 86, content: 'Nuevo mensaje\nTu diseño fue guardado correctamente.', style: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#dbe4f0', borderWidth: 1, borderRadius: 16, padding: '16px 18px', fontSize: 15, fontWeight: '700', lineHeight: 1.35, shadow: 'medium' } },
      avatarGroup: { width: 210, height: 58, attrs: { initials: ['AN', 'MR', 'LC', '+8'] }, style: { backgroundColor: 'transparent', color: '#ffffff', fontSize: 13, fontWeight: '800' } },
      gradientPanel: { width: 420, height: 220, content: 'Lanza tu próxima idea\nUn bloque visual con gradiente para hero o CTA.', attrs: { gradient: 'linear-gradient(135deg, #2563eb, #8b5cf6)' }, style: { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: 24, padding: '38px', fontSize: 28, fontWeight: '800', lineHeight: 1.25, shadow: 'strong' } }
    };

    const variant = variants[type] || {};
    const result = Object.assign(base, variant);
    result.style = Object.assign({}, base.style, variant.style || {});
    result.attrs = Object.assign({}, base.attrs, variant.attrs || {});
    return result;
  }

  function getElement(id) {
    return state.elements.find(function (element) { return element.id === id; });
  }

  function selectedElements() {
    return state.selectedIds.map(getElement).filter(Boolean).filter(function (element) { return element.visible; });
  }

  function selectionBounds(elements) {
    const list = elements || selectedElements();
    if (!list.length) return null;
    const left = Math.min.apply(null, list.map(function (el) { return el.x; }));
    const top = Math.min.apply(null, list.map(function (el) { return el.y; }));
    const right = Math.max.apply(null, list.map(function (el) { return el.x + el.width; }));
    const bottom = Math.max.apply(null, list.map(function (el) { return el.y + el.height; }));
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  function stateSnapshot() {
    return {
      canvas: clone(state.canvas),
      elements: clone(state.elements),
      grid: state.grid,
      snap: state.snap,
      projectName: document.getElementById('projectName').value
    };
  }

  function saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateSnapshot())); } catch (error) { /* Storage may be disabled. */ }
  }

  function scheduleHistory() {
    clearTimeout(state.historyTimer);
    state.historyTimer = setTimeout(commitHistory, 260);
  }

  function commitHistory() {
    const snapshot = stateSnapshot();
    const serialized = JSON.stringify(snapshot);
    const current = state.history[state.historyIndex];
    if (current && JSON.stringify(current) === serialized) return;
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    if (state.history.length > 50) state.history.shift();
    state.historyIndex = state.history.length - 1;
    saveLocal();
    updateHistoryButtons();
  }

  function restoreHistory(index) {
    if (index < 0 || index >= state.history.length) return;
    const snapshot = clone(state.history[index]);
    state.canvas = snapshot.canvas;
    state.elements = snapshot.elements;
    state.grid = snapshot.grid;
    state.snap = snapshot.snap;
    document.getElementById('projectName').value = snapshot.projectName || 'Mi diseño';
    const previousIndex = state.historyIndex;
    state.historyIndex = index;
    state.selectedIds = [];
    state.activeId = null;
    updateHistoryButtons();
    render();
    showToast(index < previousIndex ? 'Deshecho.' : 'Historial restaurado.');
  }

  function updateHistoryButtons() {
    document.getElementById('btnUndo').disabled = state.historyIndex <= 0;
    document.getElementById('btnRedo').disabled = state.historyIndex >= state.history.length - 1;
  }

  function setZoom(value) {
    state.zoom = clamp(Math.round(value * 100) / 100, 0.35, 1.75);
    renderCanvasSize();
  }

  function fitCanvas() {
    const availableWidth = Math.max(300, canvasScroller.clientWidth - 76);
    const availableHeight = Math.max(260, canvasScroller.clientHeight - 76);
    const fit = Math.min(availableWidth / state.canvas.width, availableHeight / state.canvas.height, 1);
    setZoom(Math.max(0.35, fit));
  }

  function renderCanvasSize() {
    canvas.style.width = state.canvas.width + 'px';
    canvas.style.height = state.canvas.height + 'px';
    canvas.style.backgroundColor = state.canvas.background;
    canvas.style.transform = 'scale(' + state.zoom + ')';
    canvasViewport.style.width = state.canvas.width * state.zoom + 'px';
    canvasViewport.style.height = state.canvas.height * state.zoom + 'px';
    canvas.classList.toggle('grid-enabled', state.grid);
    document.getElementById('zoomLabel').textContent = Math.round(state.zoom * 100) + '%';
    document.getElementById('btnGrid').classList.toggle('active', state.grid);
    document.getElementById('btnSnap').classList.toggle('active', state.snap);
    document.getElementById('canvasBg').value = normalizeHex(state.canvas.background, '#ffffff');
    document.getElementById('canvasPreset').value = state.canvas.preset || 'custom';
    document.getElementById('canvasWidth').value = state.canvas.width;
    document.getElementById('canvasHeight').value = state.canvas.height;
  }

  function keepElementInPositiveSpace(element) {
    if (element.x < 0) {
      element.width = Math.max(MIN_SIZE, element.width + element.x);
      element.x = 0;
    }
    if (element.y < 0) {
      element.height = Math.max(MIN_SIZE, element.height + element.y);
      element.y = 0;
    }
  }

  function setCanvasDimension(key, value) {
    state.canvas[key] = roundCanvasSize(cleanNumber(value, state.canvas[key]));
    state.canvas.preset = 'custom';
    render();
    scheduleHistory();
  }

  function applyNodeStyles(node, element) {
    const s = element.style;
    node.style.left = element.x + 'px';
    node.style.top = element.y + 'px';
    node.style.width = element.width + 'px';
    node.style.height = element.height + 'px';
    node.style.transform = 'rotate(' + (element.rotation || 0) + 'deg)';
    node.style.backgroundColor = s.backgroundColor || 'transparent';
    node.style.color = s.color || '#1f2937';
    node.style.borderStyle = Number(s.borderWidth) > 0 ? 'solid' : 'none';
    node.style.borderColor = s.borderColor || 'transparent';
    node.style.borderWidth = cleanNumber(s.borderWidth, 0) + 'px';
    node.style.borderRadius = cleanNumber(s.borderRadius, 0) + 'px';
    node.style.opacity = clamp(cleanNumber(s.opacity, 100), 0, 100) / 100;
    node.style.padding = s.padding || '0px';
    node.style.boxShadow = shadowValue(s.shadow);
    node.style.fontFamily = s.fontFamily || 'Arial, sans-serif';
    node.style.fontSize = cleanNumber(s.fontSize, 16) + 'px';
    node.style.fontWeight = s.fontWeight || '400';
    node.style.fontStyle = s.fontStyle || 'normal';
    node.style.textAlign = s.textAlign || 'left';
    node.style.textDecoration = s.textDecoration || (element.type === 'link' ? 'underline' : '');
    node.style.lineHeight = String(s.lineHeight || 1.35);
    node.style.letterSpacing = cleanNumber(s.letterSpacing, 0) + 'px';
    node.style.zIndex = String(state.elements.indexOf(element) + 1);
    node.style.overflow = element.type === 'table' ? 'auto' : (element.type === 'image' ? 'hidden' : 'visible');
    if (!element.visible) node.style.display = 'none';
  }

  function nodeClass(element) {
    const classes = ['design-node', 'node-' + element.type];
    if (state.selectedIds.includes(element.id)) classes.push('selected');
    if (element.locked) classes.push('locked');
    return classes.join(' ');
  }

  function contentLines(element, fallback) {
    const lines = String(element.content || '').split('\n').map(function (item) { return item.trim(); }).filter(Boolean);
    return lines.length ? lines : fallback;
  }

  function createListNode(element) {
    const list = document.createElement('ul');
    contentLines(element, ['Elemento 1', 'Elemento 2']).forEach(function (text) {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    return list;
  }

  function createNavbarNode(element) {
    const nav = document.createElement('nav');
    const brand = document.createElement('strong');
    brand.textContent = element.content || 'Mi sitio';
    const links = document.createElement('span');
    links.textContent = (element.attrs.items || ['Inicio', 'Servicios', 'Contacto']).join('   ');
    nav.append(brand, links);
    nav.style.display = 'flex';
    nav.style.alignItems = 'center';
    nav.style.justifyContent = 'space-between';
    return nav;
  }

  function createFormPreviewNode(element) {
    const form = document.createElement('form');
    (element.attrs.fields || ['Nombre', 'Correo', 'Mensaje']).forEach(function (label) {
      const field = document.createElement(label === 'Mensaje' ? 'textarea' : 'input');
      field.placeholder = label;
      field.readOnly = true;
      field.style.width = '100%';
      field.style.marginBottom = '8px';
      field.style.padding = '8px 10px';
      field.style.border = '1px solid #cfd7e2';
      field.style.borderRadius = '6px';
      form.appendChild(field);
    });
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Enviar';
    button.style.padding = '8px 14px';
    button.style.border = '0';
    button.style.borderRadius = '6px';
    button.style.background = '#2563eb';
    button.style.color = '#fff';
    form.appendChild(button);
    return form;
  }

  function isDesignComponent(type) {
    return ['glass', 'stat', 'pricing', 'quote', 'feature', 'timeline', 'mockup', 'notification', 'gradientPanel'].includes(type);
  }

  function createAvatarGroupNode(element) {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.alignItems = 'center';
    (element.attrs.initials || ['AN', 'MR', 'LC']).forEach(function (initials, index) {
      const avatar = document.createElement('span');
      avatar.textContent = initials;
      avatar.style.width = '44px';
      avatar.style.height = '44px';
      avatar.style.marginLeft = index ? '-10px' : '0';
      avatar.style.display = 'grid';
      avatar.style.placeItems = 'center';
      avatar.style.border = '3px solid #fff';
      avatar.style.borderRadius = '999px';
      avatar.style.background = ['#2563eb', '#8b5cf6', '#f97316', '#0f172a'][index % 4];
      avatar.style.boxShadow = '0 8px 18px rgba(15,23,42,.16)';
      group.appendChild(avatar);
    });
    return group;
  }

  function createNode(element) {
    let node;
    const attrs = element.attrs || {};
    if (element.type === 'heading') {
      node = document.createElement('h1');
      applyTextContent(node, element);
    } else if (element.type === 'text') {
      node = document.createElement('p');
      applyTextContent(node, element);
      node.style.whiteSpace = 'pre-wrap';
    } else if (element.type === 'link') {
      node = document.createElement('a');
      node.href = attrs.href || '#';
      node.textContent = element.content;
      if (attrs.targetBlank !== false) {
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
      }
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = sAlign(element.style.textAlign);
    } else if (element.type === 'button') {
      node = document.createElement('a');
      node.href = attrs.href || '#';
      node.textContent = element.content;
      node.className = (attrs.className || 'btn btn-primary') + ' design-node';
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = sAlign(element.style.textAlign);
      node.style.textDecoration = 'none';
    } else if (element.type === 'image') {
      node = document.createElement('img');
      node.src = attrs.src || '';
      node.alt = attrs.alt || 'Imagen';
      node.className = 'design-node node-image';
      node.style.objectFit = element.style.objectFit || 'cover';
    } else if (element.type === 'icon') {
      node = document.createElement('i');
      node.className = 'bi ' + (attrs.icon || 'bi-star-fill') + ' design-node node-icon';
      node.style.display = 'grid';
      node.style.placeItems = 'center';
    } else if (element.type === 'badge') {
      node = document.createElement('span');
      node.textContent = element.content;
      node.className = (attrs.className || 'badge badge-primary') + ' design-node';
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = sAlign(element.style.textAlign);
    } else if (element.type === 'card') {
      node = document.createElement('div');
      node.textContent = element.content;
      node.className = (attrs.className || 'card') + ' design-node node-card';
    } else if (element.type === 'alert') {
      node = document.createElement('div');
      node.textContent = element.content;
      node.className = (attrs.className || 'alert alert-info') + ' design-node';
    } else if (element.type === 'navbar') {
      node = createNavbarNode(element);
    } else if (element.type === 'hero') {
      node = document.createElement('section');
      node.textContent = element.content;
      node.style.whiteSpace = 'pre-wrap';
    } else if (element.type === 'table') {
      node = createTableNode(element);
    } else if (element.type === 'list') {
      node = createListNode(element);
    } else if (element.type === 'form') {
      node = createFormPreviewNode(element);
    } else if (element.type === 'input') {
      node = document.createElement('input');
      node.type = attrs.type || 'text';
      node.placeholder = attrs.placeholder || '';
      node.className = (attrs.className || 'form-control') + ' design-node';
      node.readOnly = true;
    } else if (element.type === 'textarea') {
      node = document.createElement('textarea');
      node.placeholder = attrs.placeholder || '';
      node.className = (attrs.className || 'form-control') + ' design-node';
      node.readOnly = true;
    } else if (element.type === 'select') {
      node = document.createElement('select');
      node.className = (attrs.className || 'form-control') + ' design-node';
      (attrs.options || ['Opción']).forEach(function (text) {
        const option = document.createElement('option');
        option.textContent = text;
        node.appendChild(option);
      });
    } else if (element.type === 'checkbox') {
      node = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = true;
      check.disabled = true;
      node.append(check, document.createTextNode(' ' + (element.content || 'Opción')));
    } else if (element.type === 'progress') {
      node = document.createElement('div');
      const bar = document.createElement('span');
      bar.style.display = 'block';
      bar.style.width = clamp(cleanNumber(attrs.value, 65), 0, 100) + '%';
      bar.style.height = '100%';
      bar.style.borderRadius = 'inherit';
      bar.style.background = element.style.color || '#2563eb';
      node.appendChild(bar);
    } else if (element.type === 'video') {
      node = document.createElement('iframe');
      node.src = attrs.src || '';
      node.title = attrs.title || 'Video';
      node.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      node.style.border = '0';
    } else if (element.type === 'avatarGroup') {
      node = createAvatarGroupNode(element);
    } else if (isDesignComponent(element.type)) {
      node = document.createElement(element.type === 'quote' ? 'blockquote' : 'div');
      node.textContent = element.content;
      node.style.whiteSpace = 'pre-wrap';
    } else {
      node = document.createElement('div');
      node.className = 'design-node node-' + element.type;
      if (element.type === 'divider' || element.type === 'line') node.style.minHeight = '0';
    }

    node.dataset.id = element.id;
    node.dataset.type = element.type;
    node.setAttribute('aria-label', element.name);
    if (!node.classList.contains('design-node')) node.classList.add('design-node');
    node.className = nodeClass(element) + ' ' + Array.from(node.classList).filter(function (item) { return item !== 'design-node'; }).join(' ');
    applyNodeStyles(node, element);
    if (element.type === 'gradientPanel') node.style.background = (element.attrs && element.attrs.gradient) || element.style.backgroundColor;
    if (element.visible && ['button', 'badge', 'icon'].includes(element.type)) {
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = sAlign(element.style.textAlign);
    }
    if (element.visible && element.type === 'card') {
      node.style.display = 'flex';
      node.style.alignItems = 'center';
    }

    node.addEventListener('pointerdown', onNodePointerDown);
    node.addEventListener('dblclick', function (event) {
      event.preventDefault();
      event.stopPropagation();
      startEditingFromEvent(node, element, event);
    });
    return node;
  }

  function startEditingFromEvent(node, element, event) {
    return startEditingFromTarget(node, element, event.target);
  }

  function startEditingFromTarget(node, element, target) {
    if (element.locked) return false;
    if (element.type === 'table') {
      const cell = target && target.closest ? target.closest('[data-table-cell]') : null;
      if (!cell) return false;
      startTableCellEditing(cell, element);
      return true;
    }
    if (!TYPE_META[element.type].text) return false;
    startTextEditing(node, element);
    return true;
  }

  function editClickKey(element, event) {
    if (element.type === 'table') {
      const cell = event.target && event.target.closest ? event.target.closest('[data-table-cell]') : null;
      if (!cell) return '';
      return element.id + ':' + cell.dataset.row + ':' + cell.dataset.col;
    }
    return TYPE_META[element.type].text ? element.id : '';
  }

  function isRichTextElement(element) {
    return element && ['heading', 'text'].includes(element.type);
  }

  function applyTextContent(node, element) {
    const richText = element.attrs && element.attrs.richText;
    if (isRichTextElement(element) && richText) node.innerHTML = sanitizeRichText(richText);
    else node.textContent = element.content;
  }

  function tableCells(element) {
    element.attrs = element.attrs || {};
    if (!Array.isArray(element.attrs.cells) || !element.attrs.cells.length) {
      element.attrs.cells = [[tableCell('Columna 1'), tableCell('Columna 2')], [tableCell('Dato 1'), tableCell('Dato 2')]];
    }
    element.attrs.cells.forEach(function (row, rowIndex) {
      if (!Array.isArray(row)) {
        element.attrs.cells[rowIndex] = [];
        return;
      }
      row.forEach(function (cell, colIndex) {
        if (!cell || typeof cell !== 'object') {
          row[colIndex] = tableCell(cell);
          return;
        }
        if (cell.hidden) {
          row[colIndex] = tableCell('');
          return;
        }
        cell.text = String(cell.text || '');
        cell.style = normalizeTableCellStyle(cell.style);
        delete cell.colspan;
        delete cell.rowspan;
        delete cell.hidden;
      });
    });
    return element.attrs.cells;
  }

  function tableWidth(cells) {
    return Math.max.apply(null, cells.map(function (row) { return row.length; }).concat([1]));
  }

  function ensureTableShape(cells) {
    const width = tableWidth(cells);
    cells.forEach(function (row) {
      while (row.length < width) row.push(tableCell(''));
    });
    return width;
  }

  function firstVisibleTableCell(element) {
    const cells = tableCells(element);
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        return { row, col };
      }
    }
    return { row: 0, col: 0 };
  }

  function activeTablePosition(element) {
    const active = state.activeTableCell;
    const cells = tableCells(element);
    if (active && active.elementId === element.id && cells[active.row] && cells[active.row][active.col]) {
      return { row: active.row, col: active.col };
    }
    return firstVisibleTableCell(element);
  }

  function setActiveTableCell(element, row, col, range) {
    const cells = tableCells(element);
    row = clamp(row, 0, cells.length - 1);
    col = clamp(col, 0, cells[row].length - 1);
    state.activeTableCell = { elementId: element.id, row, col };

    if (range) {
      const anchor = state.tableSelectionAnchor && state.tableSelectionAnchor.elementId === element.id
        ? state.tableSelectionAnchor
        : { elementId: element.id, row, col };
      state.tableSelectionAnchor = anchor;
      state.tableSelectionRange = { elementId: element.id, startRow: anchor.row, startCol: anchor.col, endRow: row, endCol: col };
    } else {
      state.tableSelectionAnchor = { elementId: element.id, row, col };
      state.tableSelectionRange = null;
    }
  }

  function tableSelectionBounds(element) {
    const range = state.tableSelectionRange;
    const pos = activeTablePosition(element);
    if (!range || range.elementId !== element.id) return { top: pos.row, left: pos.col, bottom: pos.row, right: pos.col };
    return {
      top: Math.min(range.startRow, range.endRow),
      left: Math.min(range.startCol, range.endCol),
      bottom: Math.max(range.startRow, range.endRow),
      right: Math.max(range.startCol, range.endCol)
    };
  }

  function tableSelectionPositions(element) {
    const cells = tableCells(element);
    const bounds = tableSelectionBounds(element);
    const positions = [];
    for (let row = bounds.top; row <= bounds.bottom; row++) {
      for (let col = bounds.left; col <= bounds.right; col++) {
        if (cells[row] && cells[row][col]) positions.push({ row, col });
      }
    }
    return positions;
  }

  function isTableCellSelected(element, row, col) {
    const bounds = tableSelectionBounds(element);
    return row >= bounds.top && row <= bounds.bottom && col >= bounds.left && col <= bounds.right;
  }

  function applyTextToTableSelection(element, text) {
    const cells = tableCells(element);
    const positions = tableSelectionPositions(element);
    if (!positions.length) return;
    positions.forEach(function (pos) { cells[pos.row][pos.col].text = String(text); });
    commitHistory();
    render();
    showToast('Texto aplicado a ' + positions.length + ' celdas.');
  }

  function activeTableCellStyle(element) {
    const pos = activeTablePosition(element);
    const cells = tableCells(element);
    return normalizeTableCellStyle(cells[pos.row] && cells[pos.row][pos.col] && cells[pos.row][pos.col].style);
  }

  function applyTableStyleToSelection(element, patch) {
    const cells = tableCells(element);
    const positions = tableSelectionPositions(element);
    if (!positions.length) return;
    positions.forEach(function (pos) {
      const cell = cells[pos.row][pos.col];
      cell.style = normalizeTableCellStyle(cell.style);
      Object.keys(patch).forEach(function (key) {
        const value = patch[key];
        if (value === '' || value === null || value === undefined) delete cell.style[key];
        else cell.style[key] = value;
      });
    });
    commitHistory();
    render();
  }

  function applyTableCellStyleToNode(node, cell) {
    const style = normalizeTableCellStyle(cell.style);
    if (style.fontSize) node.style.fontSize = cleanNumber(style.fontSize, 14) + 'px';
    if (style.fontFamily) node.style.fontFamily = style.fontFamily;
    if (style.color) node.style.color = style.color;
    if (style.backgroundColor) node.style.backgroundColor = style.backgroundColor;
    if (style.fontWeight) node.style.fontWeight = style.fontWeight;
    if (style.textAlign) node.style.textAlign = style.textAlign;
  }

  function updateTableInspector(element) {
    const status = document.getElementById('tableCellStatus');
    if (!status || element.type !== 'table') return;
    const pos = activeTablePosition(element);
    const total = tableSelectionPositions(element).length;
    status.textContent = total > 1 ? total + ' celdas seleccionadas' : 'Celda: fila ' + (pos.row + 1) + ', columna ' + (pos.col + 1);
  }

  function tableAction(action, targetElement) {
    const element = targetElement || selectedElements()[0] || getElement(state.activeId);
    if (!element || element.type !== 'table') return;
    state.selectedIds = [element.id];
    state.activeId = element.id;
    const cells = tableCells(element);
    const width = ensureTableShape(cells);
    const pos = activeTablePosition(element);

    if (action === 'addRow') {
      cells.splice(pos.row + 1, 0, Array.from({ length: width }, function () { return tableCell(''); }));
      state.activeTableCell = { elementId: element.id, row: pos.row + 1, col: Math.min(pos.col, width - 1) };
      state.tableSelectionAnchor = state.activeTableCell;
      state.tableSelectionRange = null;
    }

    if (action === 'removeRow') {
      if (cells.length <= 1) { showToast('La tabla necesita al menos una fila.'); return; }
      cells.splice(pos.row, 1);
      state.activeTableCell = { elementId: element.id, row: Math.min(pos.row, cells.length - 1), col: pos.col };
      state.tableSelectionAnchor = state.activeTableCell;
      state.tableSelectionRange = null;
    }

    if (action === 'addColumn') {
      const insertAt = Math.min(width, pos.col + 1);
      cells.forEach(function (row) { row.splice(insertAt, 0, tableCell('')); });
      state.activeTableCell = { elementId: element.id, row: pos.row, col: insertAt };
      state.tableSelectionAnchor = state.activeTableCell;
      state.tableSelectionRange = null;
    }

    if (action === 'removeColumn') {
      if (width <= 1) { showToast('La tabla necesita al menos una columna.'); return; }
      cells.forEach(function (row) { row.splice(pos.col, 1); });
      state.activeTableCell = { elementId: element.id, row: pos.row, col: Math.min(pos.col, width - 2) };
      state.tableSelectionAnchor = state.activeTableCell;
      state.tableSelectionRange = null;
    }

    ensureTableShape(cells);
    commitHistory();
    render();
  }

  function parseTableText(text) {
    const lines = String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(function (row, index, list) { return row.length > 0 || index < list.length - 1; });

    const delimiter = lines.some(function (row) { return row.includes('\t'); }) ? '\t'
      : (lines.some(function (row) { return row.includes(';'); }) ? ';'
        : (lines.some(function (row) { return row.includes(','); }) ? ',' : ''));
    if (!delimiter) return null;

    return normalizeTableRows(lines.map(function (row) { return parseDelimitedRow(row, delimiter); }));
  }

  function parseDelimitedRow(row, delimiter) {
    if (delimiter === '\t') return row.split('\t').map(cleanTableValue);
    const cells = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < row.length; index++) {
      const char = row[index];
      const next = row[index + 1];
      if (char === '"' && quoted && next === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(cleanTableValue(value));
        value = '';
      } else {
        value += char;
      }
    }
    cells.push(cleanTableValue(value));
    return cells;
  }

  function parseTableHtml(html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    const table = doc.querySelector('table');
    if (!table) return null;
    const rows = Array.from(table.querySelectorAll('tr')).map(function (tr) {
      const cells = [];
      Array.from(tr.children).forEach(function (cell) {
        if (!['TD', 'TH'].includes(cell.tagName)) return;
        const colspan = Math.max(1, cleanNumber(cell.getAttribute('colspan'), 1));
        cells.push(cleanTableValue(cell.textContent));
        for (let index = 1; index < colspan; index++) cells.push('');
      });
      return cells;
    });
    return normalizeTableRows(rows);
  }

  function parseClipboardTable(clipboardData) {
    if (!clipboardData) return null;
    return parseTableHtml(clipboardData.getData('text/html')) || parseTableText(clipboardData.getData('text/plain'));
  }

  function cleanTableValue(value) {
    return String(value || '').replace(/\u00a0/g, ' ').trim();
  }

  function normalizeTableRows(rows) {
    rows = (rows || []).map(function (row) { return (Array.isArray(row) ? row : []).map(cleanTableValue); });
    while (rows.length && rows[rows.length - 1].every(function (cell) { return cell === ''; })) rows.pop();

    if (!rows.length) return null;
    const width = Math.max.apply(null, rows.map(function (row) { return row.length; }));
    if (width <= 1 && rows.length <= 1) return null;
    return rows.map(function (row) {
      const next = row.slice();
      while (next.length < width) next.push('');
      return next;
    });
  }

  function fillTableFromRows(element, rows) {
    if (!element || element.type !== 'table' || !rows || !rows.length) return false;
    element.attrs = element.attrs || {};
    element.attrs.cells = rows.map(function (row) { return row.map(function (value) { return tableCell(value); }); });
    state.selectedIds = [element.id];
    state.activeId = element.id;
    state.activeTableCell = { elementId: element.id, row: 0, col: 0 };
    state.tableSelectionAnchor = state.activeTableCell;
    state.tableSelectionRange = null;
    commitHistory();
    render();
    showToast('Tabla pegada: ' + rows.length + ' filas x ' + rows[0].length + ' columnas.');
    return true;
  }

  function selectedTableElement() {
    const selected = selectedElements();
    if (selected.length) return selected[0].type === 'table' ? selected[0] : null;
    const active = getElement(state.activeId);
    return active && active.type === 'table' ? active : null;
  }

  function createTableNode(element) {
    const table = document.createElement('table');
    const cells = tableCells(element);
    const tbody = document.createElement('tbody');
    table.className = ((element.attrs && element.attrs.className) || 'table table-bordered table-sm') + ' design-node node-table';
    table.style.borderCollapse = 'collapse';
    table.style.tableLayout = 'fixed';

    cells.forEach(function (row, rowIndex) {
      const tr = document.createElement('tr');
      row.forEach(function (value, colIndex) {
        const cell = document.createElement(rowIndex === 0 ? 'th' : 'td');
        cell.textContent = value.text;
        applyTableCellStyleToNode(cell, value);
        cell.dataset.tableCell = 'true';
        cell.dataset.row = String(rowIndex);
        cell.dataset.col = String(colIndex);
        const active = state.activeTableCell;
        if (active && active.elementId === element.id && active.row === rowIndex && active.col === colIndex) cell.classList.add('active-table-cell');
        if (isTableCellSelected(element, rowIndex, colIndex)) cell.classList.add('selected-table-cell');
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  function startTableCellEditing(cell, element) {
    if (element.locked || cell.contentEditable === 'true') return;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const cells = tableCells(element);
    const cellData = cells[row] && cells[row][col] ? cells[row][col] : tableCell('');
    const original = cellData.text;
    const selection = window.getSelection();
    const range = document.createRange();

    state.drag = null;
    state.editingId = element.id;
    setActiveTableCell(element, row, col, false);
    cell.contentEditable = 'true';
    cell.spellcheck = true;
    cell.tabIndex = -1;
    cell.focus();
    range.selectNodeContents(cell);
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEditing(save) {
      if (cell.contentEditable !== 'true') return;
      cell.removeEventListener('blur', onBlur);
      cell.removeEventListener('keydown', onKeyDown);
      cell.contentEditable = 'false';
      state.editingId = null;
      selection.removeAllRanges();

      if (!save) {
        cell.textContent = original;
        return;
      }

      const next = cell.textContent;
      if (!cells[row]) cells[row] = [];
      if (next !== original) {
        cells[row][col].text = next;
        commitHistory();
        render();
      }
    }

    function onBlur() {
      finishEditing(true);
    }

    function onKeyDown(event) {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        finishEditing(true);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        finishEditing(false);
      }
    }

    cell.addEventListener('blur', onBlur);
    cell.addEventListener('keydown', onKeyDown);
  }

  function selectionInside(node) {
    const selection = window.getSelection();
    return selection && selection.rangeCount && node.contains(selection.anchorNode) && node.contains(selection.focusNode);
  }

  function applyStyleToTextSelection(node, styles, saveSelection, restoreSelection) {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selectionInside(node)) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement('span');
    Object.keys(styles).forEach(function (key) { span.style[key] = styles[key]; });
    try {
      range.surroundContents(span);
    } catch (error) {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    saveSelection();
  }

  function createRichTextToolbar(node, element, saveSelection, restoreSelection) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar';
    toolbar.style.left = clamp(element.x, 4, Math.max(4, state.canvas.width - 360)) + 'px';
    toolbar.style.top = Math.max(4, element.y - 42) + 'px';
    toolbar.addEventListener('pointerdown', function (event) { event.stopPropagation(); });

    function button(label, title, action) {
      const control = document.createElement('button');
      control.type = 'button';
      control.textContent = label;
      control.title = title;
      control.addEventListener('pointerdown', function (event) { event.preventDefault(); });
      control.addEventListener('click', function () {
        restoreSelection();
        action();
        saveSelection();
        node.focus();
      });
      toolbar.appendChild(control);
      return control;
    }

    button('B', 'Negrita', function () { document.execCommand('bold', false); });
    button('I', 'Cursiva', function () { document.execCommand('italic', false); });
    button('U', 'Subrayado', function () { document.execCommand('underline', false); });

    const fontSize = document.createElement('select');
    [8, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 96].forEach(function (size) {
      const option = document.createElement('option');
      option.value = String(size);
      option.textContent = size + ' px';
      fontSize.appendChild(option);
    });
    fontSize.value = cleanNumber(element.style.fontSize, 16);
    fontSize.title = 'Tamaño de fuente';
    fontSize.addEventListener('focus', saveSelection);
    fontSize.addEventListener('change', function () {
      const size = Math.max(1, cleanNumber(fontSize.value, element.style.fontSize || 16));
      applyStyleToTextSelection(node, { fontSize: size + 'px' }, saveSelection, restoreSelection);
    });
    toolbar.appendChild(fontSize);

    const color = document.createElement('input');
    color.type = 'color';
    color.value = normalizeHex(element.style.color, '#1f2937');
    color.title = 'Color de texto';
    color.addEventListener('focus', saveSelection);
    color.addEventListener('input', function () { applyStyleToTextSelection(node, { color: color.value }, saveSelection, restoreSelection); });
    toolbar.appendChild(color);

    const background = document.createElement('input');
    background.type = 'color';
    background.value = '#fff3a3';
    background.title = 'Resaltado';
    background.addEventListener('focus', saveSelection);
    background.addEventListener('input', function () { applyStyleToTextSelection(node, { backgroundColor: background.value }, saveSelection, restoreSelection); });
    toolbar.appendChild(background);

    canvas.appendChild(toolbar);
    return toolbar;
  }

  function startTextEditing(node, element) {
    if (node.contentEditable === 'true') return;

    const original = element.content;
    const originalRichText = element.attrs && element.attrs.richText;
    const selection = window.getSelection();
    const range = document.createRange();
    let savedRange = null;
    let toolbar = null;

    state.drag = null;
    state.editingId = element.id;
    node.contentEditable = 'true';
    node.spellcheck = true;
    node.tabIndex = -1;
    node.focus();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);

    function saveSelection() {
      if (selectionInside(node)) savedRange = window.getSelection().getRangeAt(0).cloneRange();
    }

    function restoreSelection() {
      if (!savedRange) return;
      const currentSelection = window.getSelection();
      currentSelection.removeAllRanges();
      currentSelection.addRange(savedRange);
    }

    if (isRichTextElement(element)) toolbar = createRichTextToolbar(node, element, saveSelection, restoreSelection);
    saveSelection();

    function finishEditing(save) {
      if (node.contentEditable !== 'true') return;
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('keyup', saveSelection);
      node.removeEventListener('mouseup', saveSelection);
      document.removeEventListener('selectionchange', saveSelection);
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      node.contentEditable = 'false';
      state.editingId = null;
      selection.removeAllRanges();
      if (toolbar) toolbar.remove();

      if (!save) {
        element.content = original;
        element.attrs = element.attrs || {};
        if (originalRichText) element.attrs.richText = originalRichText;
        else delete element.attrs.richText;
        applyTextContent(node, element);
        return;
      }

      const next = node.textContent;
      const nextRichText = isRichTextElement(element) ? sanitizeRichText(node.innerHTML) : '';
      if (next !== element.content || nextRichText !== originalRichText) {
        element.content = next;
        if (isRichTextElement(element)) {
          element.attrs = element.attrs || {};
          element.attrs.richText = nextRichText;
        }
        commitHistory();
        render();
      }
    }

    function onKeyDown(event) {
      event.stopPropagation();
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finishEditing(true);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        finishEditing(false);
      }
    }

    function onDocumentPointerDown(event) {
      if (node.contains(event.target) || (toolbar && toolbar.contains(event.target))) return;
      finishEditing(true);
    }

    node.addEventListener('keydown', onKeyDown);
    node.addEventListener('keyup', saveSelection);
    node.addEventListener('mouseup', saveSelection);
    document.addEventListener('selectionchange', saveSelection);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
  }

  function sAlign(value) {
    if (value === 'center') return 'center';
    if (value === 'right') return 'flex-end';
    return 'flex-start';
  }

  function renderSelectionFrame() {
    const selected = selectedElements();
    if (!selected.length) return;
    const bounds = selectionBounds(selected);
    if (!bounds) return;
    const frame = document.createElement('div');
    frame.className = 'selection-frame' + (selected.length > 1 ? ' multi' : '');
    frame.style.left = bounds.x + 'px';
    frame.style.top = bounds.y + 'px';
    frame.style.width = Math.max(1, bounds.width) + 'px';
    frame.style.height = Math.max(1, bounds.height) + 'px';

    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function (handle) {
      const grip = document.createElement('span');
      grip.className = 'resize-handle';
      grip.dataset.handle = handle;
      grip.addEventListener('pointerdown', function (event) { startResize(event, handle, bounds); });
      frame.appendChild(grip);
    });

    if (selected.length === 1) {
      const rotate = document.createElement('span');
      rotate.className = 'rotate-handle';
      rotate.addEventListener('pointerdown', startRotate);
      frame.appendChild(rotate);
    }
    canvas.appendChild(frame);
  }

  function renderTableToolbar() {
    const selected = selectedElements();
    if (selected.length !== 1 || selected[0].type !== 'table') return;

    const element = selected[0];
    const pos = activeTablePosition(element);
    const selectedCount = tableSelectionPositions(element).length;
    const toolbar = document.createElement('div');
    const actions = [
      ['addRow', '+ Fila'],
      ['removeRow', '- Fila'],
      ['addColumn', '+ Col'],
      ['removeColumn', '- Col']
    ];

    toolbar.className = 'table-canvas-toolbar';
    toolbar.style.left = clamp(element.x, 4, Math.max(4, state.canvas.width - 560)) + 'px';
    toolbar.style.top = Math.max(4, element.y - 38) + 'px';
    toolbar.addEventListener('pointerdown', function (event) {
      if (['INPUT', 'SELECT'].includes(event.target.tagName)) return;
      event.preventDefault();
      event.stopPropagation();
    });

    const status = document.createElement('span');
    status.className = 'table-canvas-status';
    status.textContent = selectedCount > 1 ? selectedCount + ' celdas' : 'F' + (pos.row + 1) + ' C' + (pos.col + 1);
    toolbar.appendChild(status);

    const currentStyle = activeTableCellStyle(element);
    const fontSize = document.createElement('input');
    fontSize.className = 'table-canvas-number';
    fontSize.type = 'number';
    fontSize.min = '8';
    fontSize.max = '96';
    fontSize.value = currentStyle.fontSize || '';
    fontSize.placeholder = 'px';
    fontSize.title = 'Tamaño de fuente';
    fontSize.addEventListener('change', function () { applyTableStyleToSelection(element, { fontSize: cleanNumber(fontSize.value, 14) }); });
    toolbar.appendChild(fontSize);

    const fontFamily = document.createElement('select');
    fontFamily.className = 'table-canvas-select';
    [['', 'Fuente'], ['Arial, sans-serif', 'Arial'], ['Helvetica, Arial, sans-serif', 'Helvetica'], ['Georgia, serif', 'Georgia'], ["'Courier New', monospace", 'Courier']].forEach(function (option) {
      const item = document.createElement('option');
      item.value = option[0];
      item.textContent = option[1];
      fontFamily.appendChild(item);
    });
    fontFamily.value = currentStyle.fontFamily || '';
    fontFamily.addEventListener('change', function () { applyTableStyleToSelection(element, { fontFamily: fontFamily.value }); });
    toolbar.appendChild(fontFamily);

    const textColor = document.createElement('input');
    textColor.className = 'table-canvas-color';
    textColor.type = 'color';
    textColor.title = 'Color de texto';
    textColor.value = normalizeHex(currentStyle.color, '#1f2937');
    textColor.addEventListener('change', function () { applyTableStyleToSelection(element, { color: textColor.value }); });
    toolbar.appendChild(textColor);

    const bgColor = document.createElement('input');
    bgColor.className = 'table-canvas-color';
    bgColor.type = 'color';
    bgColor.title = 'Color de fondo';
    bgColor.value = normalizeHex(currentStyle.backgroundColor, '#ffffff');
    bgColor.addEventListener('change', function () { applyTableStyleToSelection(element, { backgroundColor: bgColor.value }); });
    toolbar.appendChild(bgColor);

    const bold = document.createElement('button');
    bold.type = 'button';
    bold.textContent = 'B';
    bold.title = 'Negrita';
    bold.classList.toggle('active-format', currentStyle.fontWeight === '700');
    bold.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      event.stopPropagation();
      applyTableStyleToSelection(element, { fontWeight: currentStyle.fontWeight === '700' ? '400' : '700' });
    });
    toolbar.appendChild(bold);

    const align = document.createElement('select');
    align.className = 'table-canvas-select compact';
    [['', 'Align'], ['left', 'Izq'], ['center', 'Centro'], ['right', 'Der']].forEach(function (option) {
      const item = document.createElement('option');
      item.value = option[0];
      item.textContent = option[1];
      align.appendChild(item);
    });
    align.value = currentStyle.textAlign || '';
    align.addEventListener('change', function () { applyTableStyleToSelection(element, { textAlign: align.value }); });
    toolbar.appendChild(align);

    actions.forEach(function (item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.tableAction = item[0];
      button.textContent = item[1];
      button.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        event.stopPropagation();
        tableAction(item[0], element);
      });
      toolbar.appendChild(button);
    });

    canvas.appendChild(toolbar);
  }

  function renderLayers() {
    layersList.innerHTML = '';
    document.getElementById('layerCount').textContent = state.elements.length + (state.elements.length === 1 ? ' elemento' : ' elementos');
    state.elements.slice().reverse().forEach(function (element) {
      const item = document.createElement('div');
      item.className = 'layer-item' + (state.selectedIds.includes(element.id) ? ' active' : '');
      const type = document.createElement('span');
      type.className = 'layer-type';
      type.innerHTML = '<i class="bi ' + TYPE_META[element.type].icon + '"></i>';
      const label = document.createElement('input');
      label.type = 'text';
      label.className = 'layer-name';
      label.value = element.name;
      label.title = element.name;
      label.addEventListener('focus', function (event) {
        if (!state.selectedIds.includes(element.id)) selectElement(element.id, event.shiftKey, true);
      });
      label.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
      label.addEventListener('input', function () {
        element.name = String(label.value || TYPE_META[element.type].label).trim() || TYPE_META[element.type].label;
        const active = getElement(state.activeId);
        if (active && active.id === element.id) {
          document.getElementById('selectedTitle').textContent = element.name;
          document.getElementById('selectionStatus').textContent = element.name;
        }
        scheduleHistory();
      });
      label.addEventListener('change', function () { commitHistory(); renderLayers(); });
      const hide = document.createElement('button');
      hide.type = 'button';
      hide.className = 'layer-mini';
      hide.title = element.visible ? 'Ocultar capa' : 'Mostrar capa';
      hide.innerHTML = '<i class="bi ' + (element.visible ? 'bi-eye' : 'bi-eye-slash') + '"></i>';
      hide.addEventListener('click', function (event) {
        event.stopPropagation();
        element.visible = !element.visible;
        if (!element.visible) state.selectedIds = state.selectedIds.filter(function (id) { return id !== element.id; });
        commitHistory();
        render();
      });
      const lock = document.createElement('button');
      lock.type = 'button';
      lock.className = 'layer-mini';
      lock.title = element.locked ? 'Desbloquear capa' : 'Bloquear capa';
      lock.innerHTML = '<i class="bi ' + (element.locked ? 'bi-lock-fill' : 'bi-unlock') + '"></i>';
      lock.addEventListener('click', function (event) {
        event.stopPropagation();
        element.locked = !element.locked;
        commitHistory();
        render();
      });
      item.append(type, label, hide, lock);
      layersList.appendChild(item);
    });
  }

  function renderInspector() {
    const empty = document.getElementById('inspectorEmpty');
    const multiple = document.getElementById('inspectorMultiple');
    const form = document.getElementById('inspectorForm');
    const title = document.getElementById('selectedTitle');
    const badge = document.getElementById('selectedBadge');
    const selected = selectedElements();
    badge.textContent = String(selected.length);

    if (!selected.length) {
      empty.classList.remove('d-none');
      multiple.classList.add('d-none');
      form.classList.add('d-none');
      title.textContent = 'Sin selección';
      document.getElementById('selectionStatus').textContent = 'Sin selección';
      return;
    }

    empty.classList.add('d-none');
    if (selected.length > 1) {
      multiple.classList.remove('d-none');
      form.classList.add('d-none');
      title.textContent = selected.length + ' elementos';
      document.getElementById('multipleText').textContent = selected.length + ' elementos seleccionados';
      document.getElementById('selectionStatus').textContent = selected.length + ' elementos';
      return;
    }

    multiple.classList.add('d-none');
    form.classList.remove('d-none');
    const element = selected[0];
    title.textContent = element.name;
    document.getElementById('selectionStatus').textContent = element.name;
    populateProps(element);
  }

  function setValue(control, value) {
    if (!control) return;
    if (control.tagName === 'SELECT' && value !== undefined && value !== null && value !== '' && !Array.from(control.options).some(function (option) { return option.value === String(value); })) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value) + ' px';
      control.appendChild(option);
    }
    control.value = value === undefined || value === null ? '' : value;
  }

  function applyLinkPreset(element, preset) {
    const s = element.style;
    element.attrs = element.attrs || {};
    element.attrs.linkPreset = preset;
    if (preset === 'normal') {
      Object.assign(s, { backgroundColor: 'transparent', color: '#2563eb', borderColor: 'transparent', borderWidth: 0, borderRadius: 0, padding: '0px', fontWeight: '600', textDecoration: 'underline' });
    } else if (preset === 'subtle') {
      Object.assign(s, { backgroundColor: '#f1f5f9', color: '#475569', borderColor: 'transparent', borderWidth: 0, borderRadius: 6, padding: '6px 10px', fontWeight: '600', textDecoration: 'none' });
    } else if (preset === 'button') {
      Object.assign(s, { backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#2563eb', borderWidth: 1, borderRadius: 8, padding: '8px 14px', fontWeight: '700', textAlign: 'center', textDecoration: 'none' });
    } else if (preset === 'outline') {
      Object.assign(s, { backgroundColor: 'transparent', color: '#2563eb', borderColor: '#2563eb', borderWidth: 1, borderRadius: 8, padding: '8px 14px', fontWeight: '700', textAlign: 'center', textDecoration: 'none' });
    } else if (preset === 'pill') {
      Object.assign(s, { backgroundColor: '#eaf1ff', color: '#1d5ac6', borderColor: 'transparent', borderWidth: 0, borderRadius: 999, padding: '8px 14px', fontWeight: '700', textAlign: 'center', textDecoration: 'none' });
    }
  }

  function populateProps(element) {
    const s = element.style;
    setValue(props.name, element.name);
    setValue(props.content, element.content);
    setValue(props.x, element.x);
    setValue(props.y, element.y);
    setValue(props.width, element.width);
    setValue(props.height, element.height);
    setValue(props.rotation, element.rotation || 0);
    document.getElementById('rotationValue').textContent = (element.rotation || 0) + '°';
    setValue(props.bg, normalizeHex(s.backgroundColor, '#FFFFFF').toUpperCase());
    setValue(props.color, normalizeHex(s.color, '#1F2937').toUpperCase());
    setValue(props.borderColor, normalizeHex(s.borderColor, '#000000').toUpperCase());
    setValue(props.borderWidth, s.borderWidth);
    setValue(props.radius, s.borderRadius);
    setValue(props.opacity, s.opacity);
    setValue(props.padding, s.padding);
    setValue(props.shadow, s.shadow);
    setValue(props.fontFamily, s.fontFamily);
    setValue(props.fontSize, s.fontSize);
    setValue(props.fontWeight, s.fontWeight);
    setValue(props.textAlign, s.textAlign);
    setValue(props.lineHeight, s.lineHeight);
    setValue(props.letterSpacing, s.letterSpacing);
    setValue(props.italic, s.fontStyle);
    setValue(props.objectFit, s.objectFit);
    setValue(props.linkPreset, (element.attrs && element.attrs.linkPreset) || 'normal');
    setValue(props.linkDecoration, s.textDecoration || (element.type === 'link' ? 'underline' : 'none'));
    if (props.linkTarget) props.linkTarget.checked = !(element.attrs && element.attrs.targetBlank === false);
    props.bgPicker.value = normalizeHex(s.backgroundColor, '#ffffff');
    props.colorPicker.value = normalizeHex(s.color, '#1f2937');
    props.borderPicker.value = normalizeHex(s.borderColor, '#000000');

    document.getElementById('tableSection').classList.toggle('d-none', element.type !== 'table');
    document.getElementById('linkSection').classList.toggle('d-none', !['button', 'link'].includes(element.type));
    document.getElementById('resourceSection').classList.toggle('d-none', !['image', 'video'].includes(element.type));
    document.getElementById('iconSection').classList.toggle('d-none', element.type !== 'icon');
    const urlGroup = document.getElementById('urlGroup');
    const urlLabel = urlGroup.querySelector('label');
    urlGroup.classList.toggle('d-none', !['button', 'image', 'link', 'video'].includes(element.type));
    if (['button', 'link'].includes(element.type)) {
      document.getElementById('linkSection').insertBefore(urlGroup, document.getElementById('linkSection').children[1]);
      urlLabel.textContent = 'URL o enlace';
    } else if (['image', 'video'].includes(element.type)) {
      document.getElementById('imageUrlGroup').appendChild(urlGroup);
      urlLabel.textContent = element.type === 'video' ? 'URL embed de video' : 'URL de imagen';
    }
    document.getElementById('iconGroup').classList.toggle('d-none', element.type !== 'icon');
    document.getElementById('typographySection').classList.toggle('d-none', !(['heading', 'text', 'link', 'button', 'badge', 'card', 'alert', 'icon', 'navbar', 'hero', 'list', 'checkbox', 'glass', 'stat', 'pricing', 'quote', 'feature', 'timeline', 'mockup', 'notification', 'gradientPanel'].includes(element.type)));
    document.getElementById('propObjectFit').closest('.form-group').classList.toggle('d-none', element.type !== 'image');
    setValue(props.url, ['image', 'video'].includes(element.type) ? (element.attrs.src || '') : (element.attrs.href || ''));
    setValue(props.icon, element.attrs.icon || 'bi-star-fill');
    updateTableInspector(element);
  }

  function render() {
    renderCanvasSize();
    canvas.innerHTML = '';
    state.elements.forEach(function (element) {
      canvas.appendChild(createNode(element));
    });
    renderSelectionFrame();
    renderTableToolbar();
    renderLayers();
    renderInspector();
  }

  function selectElement(id, additive, force) {
    const element = getElement(id);
    if (!element || !element.visible) return;
    if (element.locked && !force) {
      showToast('La capa está bloqueada. Desbloquéala desde Capas.');
      return;
    }
    if (additive) {
      if (state.selectedIds.includes(id)) state.selectedIds = state.selectedIds.filter(function (selectedId) { return selectedId !== id; });
      else state.selectedIds.push(id);
    } else {
      state.selectedIds = [id];
    }
    state.activeId = state.selectedIds.length ? id : null;
    render();
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / state.zoom,
      y: (event.clientY - rect.top) / state.zoom
    };
  }

  function onNodePointerDown(event) {
    if (event.currentTarget.contentEditable === 'true' || (event.target && event.target.isContentEditable)) {
      event.stopPropagation();
      return;
    }
    const id = event.currentTarget.dataset.id;
    const element = getElement(id);
    if (!element || element.locked) {
      if (element && element.locked) showToast('La capa está bloqueada.');
      return;
    }

    const editKey = editClickKey(element, event);
    if (element.type === 'table' && editKey) {
      const cell = event.target.closest('[data-table-cell]');
      setActiveTableCell(element, Number(cell.dataset.row), Number(cell.dataset.col), event.shiftKey);
    } else if (element.type !== 'table') {
      state.activeTableCell = null;
      state.tableSelectionAnchor = null;
      state.tableSelectionRange = null;
    }
    const now = Date.now();
    const last = state.lastEditClick;
    if (editKey && last && last.key === editKey && now - last.time < 520) {
      event.preventDefault();
      event.stopPropagation();
      state.drag = null;
      state.lastEditClick = null;
      state.selectedIds = [id];
      state.activeId = id;
      startEditingFromEvent(event.currentTarget, element, event);
      return;
    }

    state.lastEditClick = editKey ? { key: editKey, time: now } : null;
    event.preventDefault();
    event.stopPropagation();
    const alreadySelected = state.selectedIds.includes(id);
    if (!alreadySelected) {
      selectElement(id, event.shiftKey, true);
      return;
    }
    else if (event.shiftKey && element.type !== 'table') {
      selectElement(id, true, true);
      return;
    }
    const start = canvasPoint(event);
    const originals = selectedElements().map(function (item) { return { id: item.id, x: item.x, y: item.y }; });
    state.drag = { mode: 'move', start, originals, moved: false, editNode: event.currentTarget, editTarget: alreadySelected && editKey ? event.target : null, editElementId: id };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onCanvasPointerDown(event) {
    if (event.target !== canvas) return;
    event.preventDefault();
    const start = canvasPoint(event);
    if (!event.shiftKey) {
      state.selectedIds = [];
      state.activeId = null;
      state.activeTableCell = null;
      state.tableSelectionAnchor = null;
      state.tableSelectionRange = null;
      render();
    }
    const marquee = document.createElement('div');
    marquee.className = 'marquee';
    marquee.style.left = start.x + 'px';
    marquee.style.top = start.y + 'px';
    canvas.appendChild(marquee);
    state.drag = { mode: 'marquee', start, marquee, additive: event.shiftKey };
    canvas.setPointerCapture(event.pointerId);
  }

  function startResize(event, handle, bounds) {
    event.preventDefault();
    event.stopPropagation();
    const start = canvasPoint(event);
    const originals = selectedElements().map(function (item) { return clone(item); });
    state.drag = { mode: 'resize', handle, start, bounds: clone(bounds), originals, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function startRotate(event) {
    event.preventDefault();
    event.stopPropagation();
    const selected = selectedElements();
    if (selected.length !== 1) return;
    const element = selected[0];
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + (element.x + element.width / 2) * state.zoom;
    const centerY = rect.top + (element.y + element.height / 2) * state.zoom;
    state.drag = {
      mode: 'rotate',
      elementId: element.id,
      centerX,
      centerY,
      startRotation: element.rotation || 0,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateMove(event, drag) {
    const point = canvasPoint(event);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    drag.originals.forEach(function (original) {
      const element = getElement(original.id);
      if (!element) return;
      element.x = clamp(snap(original.x + dx), 0, Math.max(0, state.canvas.width - element.width));
      element.y = clamp(snap(original.y + dy), 0, Math.max(0, state.canvas.height - element.height));
    });
    drag.moved = true;
    render();
  }

  function resizeBounds(original, handle, dx, dy) {
    let x = original.x;
    let y = original.y;
    let width = original.width;
    let height = original.height;
    if (handle.includes('e')) width = Math.max(MIN_SIZE, original.width + dx);
    if (handle.includes('s')) height = Math.max(MIN_SIZE, original.height + dy);
    if (handle.includes('w')) {
      width = Math.max(MIN_SIZE, original.width - dx);
      x = original.x + original.width - width;
    }
    if (handle.includes('n')) {
      height = Math.max(MIN_SIZE, original.height - dy);
      y = original.y + original.height - height;
    }
    return { x: snap(x), y: snap(y), width: snap(width), height: snap(height) };
  }

  function updateResize(event, drag) {
    const point = canvasPoint(event);
    const next = resizeBounds(drag.bounds, drag.handle, point.x - drag.start.x, point.y - drag.start.y);
    const scaleX = drag.bounds.width ? next.width / drag.bounds.width : 1;
    const scaleY = drag.bounds.height ? next.height / drag.bounds.height : 1;
    drag.originals.forEach(function (original) {
      const element = getElement(original.id);
      if (!element) return;
      element.x = snap(next.x + (original.x - drag.bounds.x) * scaleX);
      element.y = snap(next.y + (original.y - drag.bounds.y) * scaleY);
      element.width = Math.max(MIN_SIZE, snap(original.width * scaleX));
      element.height = Math.max(MIN_SIZE, snap(original.height * scaleY));
      keepElementInPositiveSpace(element);
    });
    drag.moved = true;
    render();
  }

  function updateRotate(event, drag) {
    const element = getElement(drag.elementId);
    if (!element) return;
    const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
    let rotation = drag.startRotation + angle - drag.startAngle;
    if (state.snap) rotation = Math.round(rotation / 5) * 5;
    element.rotation = Math.round(rotation);
    drag.moved = true;
    render();
  }

  function intersects(bounds, element) {
    return !(element.x > bounds.x + bounds.width || element.x + element.width < bounds.x || element.y > bounds.y + bounds.height || element.y + element.height < bounds.y);
  }

  function updateMarquee(event, drag) {
    const point = canvasPoint(event);
    const left = Math.min(drag.start.x, point.x);
    const top = Math.min(drag.start.y, point.y);
    const width = Math.abs(point.x - drag.start.x);
    const height = Math.abs(point.y - drag.start.y);
    drag.marquee.style.left = left + 'px';
    drag.marquee.style.top = top + 'px';
    drag.marquee.style.width = width + 'px';
    drag.marquee.style.height = height + 'px';
    const bounds = { x: left, y: top, width, height };
    const hits = state.elements.filter(function (element) { return element.visible && !element.locked && intersects(bounds, element); }).map(function (element) { return element.id; });
    state.selectedIds = drag.additive ? Array.from(new Set(state.selectedIds.concat(hits))) : hits;
    state.activeId = state.selectedIds[0] || null;
    renderInspector();
    document.querySelectorAll('.design-node').forEach(function (node) { node.classList.toggle('selected', state.selectedIds.includes(node.dataset.id)); });
  }

  function onPointerMove(event) {
    if (!state.drag) return;
    if (state.drag.mode === 'move') updateMove(event, state.drag);
    if (state.drag.mode === 'resize') updateResize(event, state.drag);
    if (state.drag.mode === 'rotate') updateRotate(event, state.drag);
    if (state.drag.mode === 'marquee') updateMarquee(event, state.drag);
  }

  function onPointerUp() {
    if (!state.drag) return;
    const drag = state.drag;
    if (drag.mode === 'marquee' && drag.marquee && drag.marquee.parentNode) {
      drag.marquee.remove();
      render();
    }
    if (drag.mode === 'move' && !drag.moved && drag.editTarget) {
      const element = getElement(drag.editElementId);
      state.drag = null;
      if (element && element.type === 'table') render();
      else if (element) startEditingFromTarget(drag.editNode, element, drag.editTarget);
      return;
    }
    if (drag.moved) commitHistory();
    state.drag = null;
  }

  function addElement(type, x, y) {
    if (!TYPE_META[type]) return;
    const element = makeElement(type, x, y);
    element.x = clamp(element.x, 0, Math.max(0, state.canvas.width - element.width));
    element.y = clamp(element.y, 0, Math.max(0, state.canvas.height - element.height));
    state.elements.push(element);
    state.selectedIds = [element.id];
    state.activeId = element.id;
    commitHistory();
    render();
    showToast(TYPE_META[type].label + ' agregado.');
  }

  function duplicateSelection() {
    const selected = selectedElements();
    if (!selected.length) return;
    const copies = selected.map(function (element) {
      const copy = clone(element);
      copy.id = uid();
      copy.name = element.name + ' copia';
      copy.x = clamp(snap(element.x + 20), 0, state.canvas.width - copy.width);
      copy.y = clamp(snap(element.y + 20), 0, state.canvas.height - copy.height);
      return copy;
    });
    state.elements.push.apply(state.elements, copies);
    state.selectedIds = copies.map(function (copy) { return copy.id; });
    state.activeId = state.selectedIds[0] || null;
    commitHistory();
    render();
    showToast('Elemento duplicado.');
  }

  function deleteSelection() {
    if (!state.selectedIds.length) return;
    const ids = new Set(state.selectedIds);
    state.elements = state.elements.filter(function (element) { return !ids.has(element.id); });
    state.selectedIds = [];
    state.activeId = null;
    commitHistory();
    render();
    showToast('Elemento eliminado.');
  }

  function copySelection() {
    const selected = selectedElements();
    if (!selected.length) return;
    state.clipboard = clone(selected);
    showToast(selected.length === 1 ? 'Elemento copiado.' : selected.length + ' elementos copiados.');
  }

  function pasteSelection() {
    if (!state.clipboard.length) return;
    const copies = state.clipboard.map(function (element) {
      const copy = clone(element);
      copy.id = uid();
      copy.x = clamp(snap(copy.x + 20), 0, state.canvas.width - copy.width);
      copy.y = clamp(snap(copy.y + 20), 0, state.canvas.height - copy.height);
      return copy;
    });
    state.elements.push.apply(state.elements, copies);
    state.selectedIds = copies.map(function (copy) { return copy.id; });
    state.activeId = state.selectedIds[0] || null;
    commitHistory();
    render();
    showToast('Pegado en el lienzo.');
  }

  async function pasteIntoSelectedTable() {
    const table = selectedTableElement();
    if (!table || !navigator.clipboard || !navigator.clipboard.readText) return false;
    try {
      const rows = parseTableText(await navigator.clipboard.readText());
      return rows ? fillTableFromRows(table, rows) : false;
    } catch (error) {
      return false;
    }
  }

  function handlePaste(event) {
    const tag = document.activeElement && document.activeElement.tagName;
    const editingText = document.activeElement && document.activeElement.isContentEditable;
    if (!editingText && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const table = selectedTableElement();
    if (!table || !event.clipboardData) return;
    const rows = parseClipboardTable(event.clipboardData);
    if (!rows) return;
    event.preventDefault();
    if (editingText) document.activeElement.blur();
    fillTableFromRows(table, rows);
  }

  function moveLayer(direction) {
    const ids = state.selectedIds;
    if (!ids.length) return;
    const selected = state.elements.filter(function (element) { return ids.includes(element.id); });
    const rest = state.elements.filter(function (element) { return !ids.includes(element.id); });
    state.elements = direction === 'front' ? rest.concat(selected) : selected.concat(rest);
    commitHistory();
    render();
  }

  function alignSelection(mode) {
    const selected = selectedElements();
    if (!selected.length) return;
    const bounds = selectionBounds(selected);
    if (selected.length === 1) {
      const item = selected[0];
      if (mode === 'left') item.x = 0;
      if (mode === 'center') item.x = snap((state.canvas.width - item.width) / 2);
      if (mode === 'right') item.x = state.canvas.width - item.width;
      if (mode === 'top') item.y = 0;
      if (mode === 'middle') item.y = snap((state.canvas.height - item.height) / 2);
      if (mode === 'bottom') item.y = state.canvas.height - item.height;
    } else if (mode === 'left') {
      selected.forEach(function (item) { item.x = bounds.x; });
    } else if (mode === 'center') {
      selected.forEach(function (item) { item.x = snap(bounds.x + (bounds.width - item.width) / 2); });
    } else if (mode === 'right') {
      selected.forEach(function (item) { item.x = bounds.x + bounds.width - item.width; });
    } else if (mode === 'top') {
      selected.forEach(function (item) { item.y = bounds.y; });
    } else if (mode === 'middle') {
      selected.forEach(function (item) { item.y = snap(bounds.y + (bounds.height - item.height) / 2); });
    } else if (mode === 'bottom') {
      selected.forEach(function (item) { item.y = bounds.y + bounds.height - item.height; });
    } else if (mode === 'distributeX' && selected.length >= 3) {
      const ordered = selected.slice().sort(function (a, b) { return a.x - b.x; });
      const total = ordered.reduce(function (sum, item) { return sum + item.width; }, 0);
      const gap = (bounds.width - total) / (ordered.length - 1);
      let cursor = bounds.x;
      ordered.forEach(function (item) { item.x = snap(cursor); cursor += item.width + gap; });
    } else if (mode === 'distributeY' && selected.length >= 3) {
      const ordered = selected.slice().sort(function (a, b) { return a.y - b.y; });
      const total = ordered.reduce(function (sum, item) { return sum + item.height; }, 0);
      const gap = (bounds.height - total) / (ordered.length - 1);
      let cursor = bounds.y;
      ordered.forEach(function (item) { item.y = snap(cursor); cursor += item.height + gap; });
    }
    commitHistory();
    render();
  }

  function updateSelectedFromProperty(key, value) {
    const element = selectedElements()[0];
    if (!element) return;
    const s = element.style;
    const numeric = function (fallback) { return cleanNumber(value, fallback); };
    if (key === 'name') element.name = String(value || TYPE_META[element.type].label).trim() || TYPE_META[element.type].label;
    if (key === 'content') {
      element.content = String(value);
      if (element.attrs) delete element.attrs.richText;
    }
    if (key === 'url') {
      if (['image', 'video'].includes(element.type)) element.attrs.src = String(value);
      else element.attrs.href = String(value);
    }
    if (key === 'icon') element.attrs.icon = String(value);
    if (key === 'x') element.x = clamp(snap(numeric(0)), 0, Math.max(0, state.canvas.width - element.width));
    if (key === 'y') element.y = clamp(snap(numeric(0)), 0, Math.max(0, state.canvas.height - element.height));
    if (key === 'width') element.width = Math.max(MIN_SIZE, snap(numeric(element.width)));
    if (key === 'height') element.height = Math.max(MIN_SIZE, snap(numeric(element.height)));
    if (key === 'rotation') element.rotation = Math.round(numeric(0));
    if (key === 'bg') s.backgroundColor = cleanHexInput(value, '#FFFFFF');
    if (key === 'color') s.color = cleanHexInput(value, '#1F2937');
    if (key === 'borderColor') s.borderColor = cleanHexInput(value, '#000000');
    if (key === 'borderWidth') s.borderWidth = Math.max(0, numeric(0));
    if (key === 'radius') s.borderRadius = Math.max(0, numeric(0));
    if (key === 'opacity') s.opacity = clamp(numeric(100), 0, 100);
    if (key === 'padding') s.padding = String(value || '0px');
    if (key === 'shadow') s.shadow = String(value || 'none');
    if (key === 'fontFamily') s.fontFamily = String(value || 'Arial, sans-serif');
    if (key === 'fontSize') s.fontSize = Math.max(1, numeric(16));
    if (key === 'fontWeight') s.fontWeight = String(value || '400');
    if (key === 'textAlign') s.textAlign = String(value || 'left');
    if (key === 'lineHeight') s.lineHeight = Math.max(0.5, numeric(1.35));
    if (key === 'letterSpacing') s.letterSpacing = numeric(0);
    if (key === 'italic') s.fontStyle = String(value || 'normal');
    if (key === 'objectFit') s.objectFit = String(value || 'cover');
    if (key === 'linkPreset' && element.type === 'link') applyLinkPreset(element, String(value || 'normal'));
    if (key === 'linkDecoration' && element.type === 'link') s.textDecoration = String(value || 'underline');
    if (key === 'linkTarget' && element.type === 'link') {
      element.attrs = element.attrs || {};
      element.attrs.targetBlank = Boolean(value);
    }
    if (key === 'rotation') document.getElementById('rotationValue').textContent = element.rotation + '°';
    render();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeCssValue(value) {
    return /^[#\w\s.,()%+-]+$/.test(String(value || '')) ? String(value) : '';
  }

  function sanitizeStyle(style, fontSizeAttr, colorAttr) {
    const items = [];
    const fontSize = cleanNumber(style.fontSize, 0);
    if (fontSize > 0 && fontSize <= 300) items.push('font-size: ' + fontSize + 'px');
    if (fontSizeAttr) {
      const sizes = { 1: 10, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 48 };
      const converted = sizes[fontSizeAttr] || cleanNumber(fontSizeAttr, 0);
      if (converted > 0 && converted <= 300) items.push('font-size: ' + converted + 'px');
    }
    const color = safeCssValue(style.color || colorAttr);
    if (color) items.push('color: ' + color);
    const background = safeCssValue(style.backgroundColor);
    if (background) items.push('background-color: ' + background);
    const weight = safeCssValue(style.fontWeight);
    if (/^(normal|bold|[1-9]00)$/.test(weight)) items.push('font-weight: ' + weight);
    const fontStyle = safeCssValue(style.fontStyle);
    if (/^(normal|italic)$/.test(fontStyle)) items.push('font-style: ' + fontStyle);
    const decoration = safeCssValue(style.textDecorationLine || style.textDecoration);
    if (/underline/.test(decoration)) items.push('text-decoration: underline');
    return items.length ? ' style="' + escapeHtml(items.join('; ') + ';') + '"' : '';
  }

  function sanitizeRichText(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');

    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.nodeValue);
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const tag = node.tagName.toLowerCase();
      const content = Array.from(node.childNodes).map(cleanNode).join('');
      if (tag === 'br') return '<br>';
      if (tag === 'div' || tag === 'p') return content + '<br>';
      if (tag === 'b' || tag === 'strong') return '<strong>' + content + '</strong>';
      if (tag === 'i' || tag === 'em') return '<em>' + content + '</em>';
      if (tag === 'u') return '<u>' + content + '</u>';
      if (tag === 'span' || tag === 'font') {
        const style = sanitizeStyle(node.style, node.getAttribute('size'), node.getAttribute('color'));
        return '<span' + style + '>' + content + '</span>';
      }
      return content;
    }

    return Array.from(template.content.childNodes).map(cleanNode).join('').replace(/(<br>)+$/g, '');
  }

  function exportedTextContent(element) {
    if (isRichTextElement(element) && element.attrs && element.attrs.richText) return sanitizeRichText(element.attrs.richText);
    return escapeHtml(element.content).replace(/\n/g, '<br>');
  }

  function cssName(key) {
    return key.replace(/[A-Z]/g, function (match) { return '-' + match.toLowerCase(); });
  }

  function inlineStyle(element) {
    const s = element.style;
    const items = {
      position: 'absolute',
      left: element.x + 'px',
      top: element.y + 'px',
      width: element.width + 'px',
      height: element.height + 'px',
      transform: 'rotate(' + (element.rotation || 0) + 'deg)',
      'transform-origin': 'center center',
      'box-sizing': 'border-box',
      'background-color': s.backgroundColor || 'transparent',
      color: s.color || '#1f2937',
      'border-style': cleanNumber(s.borderWidth, 0) > 0 ? 'solid' : 'none',
      'border-color': s.borderColor || 'transparent',
      'border-width': cleanNumber(s.borderWidth, 0) + 'px',
      'border-radius': cleanNumber(s.borderRadius, 0) + 'px',
      opacity: clamp(cleanNumber(s.opacity, 100), 0, 100) / 100,
      padding: s.padding || '0px',
      'box-shadow': shadowValue(s.shadow),
      'font-family': s.fontFamily || 'Arial, sans-serif',
      'font-size': cleanNumber(s.fontSize, 16) + 'px',
      'font-weight': s.fontWeight || '400',
      'font-style': s.fontStyle || 'normal',
      'text-align': s.textAlign || 'left',
      'text-decoration': s.textDecoration || (element.type === 'link' ? 'underline' : 'none'),
      'line-height': s.lineHeight || 1.35,
      'letter-spacing': cleanNumber(s.letterSpacing, 0) + 'px',
      overflow: element.type === 'table' ? 'auto' : (element.type === 'image' ? 'hidden' : 'visible')
    };
    if (element.type === 'image') items['object-fit'] = s.objectFit || 'cover';
    if (element.type === 'table') {
      items.display = 'block';
      items['border-collapse'] = 'collapse';
      items['table-layout'] = 'fixed';
    }
    if (['button', 'badge', 'icon'].includes(element.type)) {
      items.display = 'flex';
      items['align-items'] = 'center';
      items['justify-content'] = sAlign(s.textAlign);
    }
    if (element.type === 'link') {
      items.display = 'flex';
      items['align-items'] = 'center';
      items['justify-content'] = sAlign(s.textAlign);
    }
    if (element.type === 'avatarGroup') {
      items.display = 'flex';
      items['align-items'] = 'center';
    }
    if (element.type === 'gradientPanel' && element.attrs && element.attrs.gradient) items.background = element.attrs.gradient;
    return Object.keys(items).map(function (key) { return cssName(key) + ': ' + items[key] + ';'; }).join(' ');
  }

  function exportedElement(element) {
    const classes = escapeHtml((element.attrs && element.attrs.className) || '');
    const classAttr = classes ? ' class="' + classes + '"' : '';
    const styleAttr = ' style="' + escapeHtml(inlineStyle(element)) + '"';
    const content = exportedTextContent(element);
    const attrs = element.attrs || {};
    if (element.type === 'heading') return '<h1' + classAttr + styleAttr + '>' + content + '</h1>';
    if (element.type === 'text') return '<p' + classAttr + styleAttr + '>' + content + '</p>';
    if (element.type === 'link') {
      const targetAttr = attrs.targetBlank === false ? '' : ' target="_blank" rel="noopener noreferrer"';
      return '<a href="' + escapeHtml(attrs.href || '#') + '"' + targetAttr + classAttr + styleAttr + '>' + content + '</a>';
    }
    if (element.type === 'button') return '<a href="' + escapeHtml(attrs.href || '#') + '"' + classAttr + styleAttr + '>' + content + '</a>';
    if (element.type === 'image') return '<img src="' + escapeHtml(attrs.src || '') + '" alt="' + escapeHtml(attrs.alt || 'Imagen') + '"' + classAttr + styleAttr + '>';
    if (element.type === 'icon') return '<i class="bi ' + escapeHtml(attrs.icon || 'bi-star-fill') + '"' + styleAttr + '></i>';
    if (element.type === 'badge') return '<span' + classAttr + styleAttr + '>' + content + '</span>';
    if (element.type === 'card' || element.type === 'alert') return '<div' + classAttr + styleAttr + '>' + content + '</div>';
    if (element.type === 'navbar') return exportedNavbar(element, classAttr, styleAttr);
    if (element.type === 'hero') return '<section' + classAttr + styleAttr + '>' + content + '</section>';
    if (element.type === 'table') return exportedTable(element, classAttr, styleAttr);
    if (element.type === 'list') return exportedList(element, classAttr, styleAttr);
    if (element.type === 'form') return exportedForm(element, classAttr, styleAttr);
    if (element.type === 'input') return '<input type="' + escapeHtml(attrs.type || 'text') + '" placeholder="' + escapeHtml(attrs.placeholder || '') + '"' + classAttr + styleAttr + '>';
    if (element.type === 'textarea') return '<textarea placeholder="' + escapeHtml(attrs.placeholder || '') + '"' + classAttr + styleAttr + '></textarea>';
    if (element.type === 'select') return '<select' + classAttr + styleAttr + '>' + (attrs.options || ['Opción']).map(function (item) { return '<option>' + escapeHtml(item) + '</option>'; }).join('') + '</select>';
    if (element.type === 'checkbox') return '<label' + styleAttr + '><input type="checkbox" checked> ' + content + '</label>';
    if (element.type === 'progress') return '<div' + classAttr + styleAttr + '><div class="progress-bar" role="progressbar" style="width: ' + clamp(cleanNumber(attrs.value, 65), 0, 100) + '%;"></div></div>';
    if (element.type === 'video') return '<iframe src="' + escapeHtml(attrs.src || '') + '" title="' + escapeHtml(attrs.title || 'Video') + '"' + styleAttr + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    if (element.type === 'avatarGroup') return exportedAvatarGroup(element, styleAttr);
    if (isDesignComponent(element.type)) {
      const tag = element.type === 'quote' ? 'blockquote' : 'div';
      return '<' + tag + classAttr + styleAttr + '>' + content + '</' + tag + '>';
    }
    return '<div' + classAttr + styleAttr + '></div>';
  }

  function exportedAvatarGroup(element, styleAttr) {
    const colors = ['#2563eb', '#8b5cf6', '#f97316', '#0f172a'];
    const avatars = ((element.attrs && element.attrs.initials) || ['AN', 'MR', 'LC']).map(function (initials, index) {
      return '<span style="width:44px;height:44px;margin-left:' + (index ? '-10px' : '0') + ';display:grid;place-items:center;border:3px solid #fff;border-radius:999px;background:' + colors[index % colors.length] + ';color:#fff;font-weight:800;box-shadow:0 8px 18px rgba(15,23,42,.16);">' + escapeHtml(initials) + '</span>';
    }).join('');
    return '<div' + styleAttr + '>' + avatars + '</div>';
  }

  function exportedNavbar(element, classAttr, styleAttr) {
    const attrs = element.attrs || {};
    const items = (attrs.items || ['Inicio', 'Servicios', 'Contacto']).map(function (item) { return '<a class="nav-link" href="#">' + escapeHtml(item) + '</a>'; }).join('');
    return '<nav' + classAttr + styleAttr + '><a class="navbar-brand" href="#">' + escapeHtml(element.content || 'Mi sitio') + '</a><div class="navbar-nav flex-row">' + items + '</div></nav>';
  }

  function exportedList(element, classAttr, styleAttr) {
    return '<ul' + classAttr + styleAttr + '>' + contentLines(element, ['Elemento']).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>';
  }

  function exportedForm(element, classAttr, styleAttr) {
    const fields = (element.attrs && element.attrs.fields) || ['Nombre', 'Correo', 'Mensaje'];
    const controls = fields.map(function (label) {
      if (label === 'Mensaje') return '<div class="form-group"><label>' + escapeHtml(label) + '</label><textarea class="form-control" placeholder="' + escapeHtml(label) + '"></textarea></div>';
      return '<div class="form-group"><label>' + escapeHtml(label) + '</label><input class="form-control" placeholder="' + escapeHtml(label) + '"></div>';
    }).join('');
    return '<form' + classAttr + styleAttr + '>' + controls + '<button class="btn btn-primary" type="submit">Enviar</button></form>';
  }

  function exportedTable(element, classAttr, styleAttr) {
    const rows = tableCells(element).map(function (row, rowIndex) {
      const tag = rowIndex === 0 ? 'th' : 'td';
      const cells = row.map(function (value) { return '<' + tag + ' style="' + escapeHtml(tableCellInlineStyle(value)) + '">' + escapeHtml(value.text) + '</' + tag + '>'; }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    return '<table' + classAttr + styleAttr + '><tbody>' + rows + '</tbody></table>';
  }

  function tableCellInlineStyle(cell) {
    const style = normalizeTableCellStyle(cell.style);
    const items = {
      border: '1px solid #cfd7e2',
      padding: '8px',
      'min-width': '50px',
      'vertical-align': 'top'
    };
    if (style.fontSize) items['font-size'] = cleanNumber(style.fontSize, 14) + 'px';
    if (style.fontFamily) items['font-family'] = style.fontFamily;
    if (style.color) items.color = style.color;
    if (style.backgroundColor) items['background-color'] = style.backgroundColor;
    if (style.fontWeight) items['font-weight'] = style.fontWeight;
    if (style.textAlign) items['text-align'] = style.textAlign;
    return Object.keys(items).map(function (key) { return key + ': ' + items[key] + ';'; }).join(' ');
  }

  function generateOutputHtml() {
    const visibleElements = state.elements.filter(function (element) { return element.visible; });
    const rows = visibleElements.map(function (element) { return '  ' + exportedElement(element); });
    const lines = ['<main style="position: relative; width: ' + state.canvas.width + 'px; min-height: ' + state.canvas.height + 'px; margin: 0 auto; overflow: hidden; background-color: ' + escapeHtml(state.canvas.background) + ';">'];
    if (rows.length) lines.push(rows.join('\n\n'));
    else lines.push('  <!-- Agrega componentes desde el editor -->');
    lines.push('</main>');
    return lines.join('\n');
  }

  function previewDocumentHtml(bodyHtml) {
    const title = escapeHtml(document.getElementById('projectName').value || 'Diseño exportado');
    return [
      '<!DOCTYPE html>',
      '<html lang="es">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>' + title + '</title>',
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">',
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">',
      '</head>',
      '<body style="margin: 0; min-height: 100vh; background-color: #eef2f7;">',
      bodyHtml,
      '</body>',
      '</html>'
    ].join('\n');
  }

  function cssNumber(value, fallback) {
    if (!value) return fallback;
    return cleanNumber(String(value).replace('px', ''), fallback);
  }

  function copyImportedStyle(element, node) {
    const s = element.style;
    const style = node.style || {};
    if (style.backgroundColor) s.backgroundColor = style.backgroundColor;
    if (style.color) s.color = style.color;
    if (style.borderColor) s.borderColor = style.borderColor;
    if (style.borderWidth) s.borderWidth = cssNumber(style.borderWidth, s.borderWidth || 0);
    if (style.borderRadius) s.borderRadius = cssNumber(style.borderRadius, s.borderRadius || 0);
    if (style.padding) s.padding = style.padding;
    if (style.fontFamily) s.fontFamily = style.fontFamily;
    if (style.fontSize) s.fontSize = cssNumber(style.fontSize, s.fontSize || 16);
    if (style.fontWeight) s.fontWeight = style.fontWeight;
    if (style.fontStyle) s.fontStyle = style.fontStyle;
    if (style.textAlign) s.textAlign = style.textAlign;
    if (style.textDecoration) s.textDecoration = style.textDecoration;
    if (style.lineHeight) s.lineHeight = cleanNumber(style.lineHeight, s.lineHeight || 1.35);
    if (style.letterSpacing) s.letterSpacing = cssNumber(style.letterSpacing, s.letterSpacing || 0);
    if (style.opacity) s.opacity = clamp(cleanNumber(style.opacity, 1) * 100, 0, 100);
    element.width = Math.max(MIN_SIZE, cssNumber(style.width, element.width));
    element.height = Math.max(MIN_SIZE, cssNumber(style.height || style.minHeight, element.height));
  }

  function importedTableCells(node) {
    const rows = Array.from(node.querySelectorAll('tr')).map(function (row) {
      return Array.from(row.children).map(function (cell) { return tableCell(cell.textContent.trim()); });
    }).filter(function (row) { return row.length; });
    return rows.length ? rows : [[tableCell('Columna 1'), tableCell('Columna 2')], [tableCell('Dato 1'), tableCell('Dato 2')]];
  }

  function importedElementType(node) {
    const tag = node.tagName.toLowerCase();
    const classes = node.className || '';
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'p') return 'text';
    if (tag === 'a') return /\bbtn\b/.test(classes) ? 'button' : 'link';
    if (tag === 'img') return 'image';
    if (tag === 'i') return 'icon';
    if (tag === 'span') return 'badge';
    if (tag === 'nav') return 'navbar';
    if (tag === 'section') return 'hero';
    if (tag === 'table') return 'table';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (tag === 'form') return 'form';
    if (tag === 'input') return 'input';
    if (tag === 'textarea') return 'textarea';
    if (tag === 'select') return 'select';
    if (tag === 'label' && node.querySelector('input[type="checkbox"]')) return 'checkbox';
    if (tag === 'progress' || /\bprogress\b/.test(classes)) return 'progress';
    if (tag === 'iframe') return 'video';
    if (tag === 'hr') return 'divider';
    if (/\balert\b/.test(classes)) return 'alert';
    if (/\bcard\b/.test(classes)) return 'card';
    return node.textContent.trim() ? 'card' : 'container';
  }

  function importNode(node, index) {
    const type = importedElementType(node);
    const style = node.style || {};
    const x = Math.max(0, snap(cssNumber(style.left, 60 + (index % 3) * 210)));
    const y = Math.max(0, snap(cssNumber(style.top, 60 + Math.floor(index / 3) * 120)));
    const element = makeElement(type, x, y);
    const classes = String(node.className || '').trim();
    element.content = node.textContent.trim() || element.content;
    element.attrs = element.attrs || {};
    if (classes && !['heading', 'text'].includes(type)) element.attrs.className = classes;
    if (type === 'heading' || type === 'text') {
      element.attrs.richText = sanitizeRichText(node.innerHTML);
      element.content = node.textContent.trim();
    }
    if (type === 'navbar') {
      const brand = node.querySelector('.navbar-brand');
      element.content = (brand && brand.textContent.trim()) || element.content;
      element.attrs.items = Array.from(node.querySelectorAll('.nav-link')).map(function (item) { return item.textContent.trim(); }).filter(Boolean);
    }
    if (type === 'list') element.content = Array.from(node.querySelectorAll('li')).map(function (item) { return item.textContent.trim(); }).filter(Boolean).join('\n');
    if (type === 'button' || type === 'link') {
      element.attrs.href = node.getAttribute('href') || '#';
      element.attrs.targetBlank = node.getAttribute('target') === '_blank';
    }
    if (type === 'image') {
      element.attrs.src = node.getAttribute('src') || '';
      element.attrs.alt = node.getAttribute('alt') || 'Imagen';
    }
    if (type === 'video') {
      element.attrs.src = node.getAttribute('src') || '';
      element.attrs.title = node.getAttribute('title') || 'Video';
    }
    if (type === 'icon') element.attrs.icon = Array.from(node.classList).find(function (item) { return item.indexOf('bi-') === 0; }) || 'bi-star-fill';
    if (type === 'input') {
      element.attrs.placeholder = node.getAttribute('placeholder') || '';
      element.attrs.type = node.getAttribute('type') || 'text';
    }
    if (type === 'textarea') element.attrs.placeholder = node.getAttribute('placeholder') || '';
    if (type === 'select') element.attrs.options = Array.from(node.querySelectorAll('option')).map(function (option) { return option.textContent.trim(); }).filter(Boolean);
    if (type === 'checkbox') element.content = node.textContent.trim() || element.content;
    if (type === 'table') element.attrs.cells = importedTableCells(node);
    copyImportedStyle(element, node);
    return element;
  }

  function importBodyCode() {
    const textarea = document.getElementById('importCode');
    const html = textarea.value.trim();
    if (!html) {
      showToast('Pega contenido HTML del body para importar.');
      return;
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const main = doc.body.querySelector('main');
    const root = main || doc.body;
    if (main) {
      state.canvas.width = roundCanvasSize(cssNumber(main.style.width, state.canvas.width));
      state.canvas.height = roundCanvasSize(cssNumber(main.style.minHeight || main.style.height, state.canvas.height));
      state.canvas.background = normalizeHex(main.style.backgroundColor, state.canvas.background);
      state.canvas.preset = 'custom';
    }
    const nodes = Array.from(root.children).filter(function (node) { return (node !== main && node.tagName && node.textContent.trim()) || ['IMG', 'INPUT', 'TEXTAREA', 'SELECT', 'TABLE', 'FORM', 'IFRAME', 'PROGRESS', 'HR'].includes(node.tagName); });
    const sourceNodes = main ? Array.from(main.children) : nodes;
    const imported = sourceNodes.filter(function (node) { return node.nodeType === 1; }).map(importNode);
    if (!imported.length) {
      showToast('No se encontraron elementos importables.');
      return;
    }
    state.elements = imported;
    state.selectedIds = [];
    state.activeId = null;
    state.activeTableCell = null;
    commitHistory();
    render();
    closeModal('importModal');
    showToast(imported.length + (imported.length === 1 ? ' elemento importado.' : ' elementos importados.'));
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openExport() {
    document.getElementById('exportCode').value = generateOutputHtml();
    openModal('exportModal');
  }

  function openPreview() {
    const frame = document.getElementById('previewFrame');
    frame.srcdoc = previewDocumentHtml(generateOutputHtml());
    openModal('previewModal');
  }

  function downloadHtml() {
    const html = document.getElementById('exportCode').value || generateOutputHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (document.getElementById('projectName').value || 'diseno-exportado').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() + '.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Archivo HTML descargado.');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function setPreset(name) {
    const presets = {
      desktop: { width: 1280, height: 720 },
      tablet: { width: 768, height: 900 },
      mobile: { width: 390, height: 844 },
      presentation: { width: 1366, height: 768 }
    };
    const preset = presets[name];
    if (!preset) {
      state.canvas.preset = 'custom';
      commitHistory();
      render();
      return;
    }
    state.canvas.width = preset.width;
    state.canvas.height = preset.height;
    state.canvas.preset = name;
    state.elements.forEach(function (element) {
      element.x = clamp(element.x, 0, Math.max(0, state.canvas.width - element.width));
      element.y = clamp(element.y, 0, Math.max(0, state.canvas.height - element.height));
    });
    commitHistory();
    render();
    fitCanvas();
  }

  function createWelcomeDesign() {
    const badge = makeElement('badge', 90, 95);
    badge.content = 'DISEÑO VISUAL';
    const title = makeElement('heading', 90, 145);
    title.content = 'Diseña con libertad\ny exporta en HTML';
    title.height = 120;
    const text = makeElement('text', 90, 286);
    text.content = 'Selecciona varios objetos, muévelos, alínéalos, cambia la rotación y crea composiciones como en PowerPoint.';
    text.width = 480;
    const button = makeElement('button', 90, 406);
    const card = makeElement('card', 805, 155);
    card.content = 'Panel visual\n100% editable';
    card.width = 280;
    card.height = 170;
    card.style.backgroundColor = '#172033';
    card.style.color = '#ffffff';
    card.style.borderWidth = 0;
    const circle = makeElement('circle', 1030, 100);
    circle.width = 145;
    circle.height = 145;
    circle.style.backgroundColor = '#a78bfa';
    circle.style.opacity = 80;
    const image = makeElement('image', 680, 330);
    image.width = 380;
    image.height = 245;
    image.style.borderRadius = 18;
    state.elements = [circle, badge, title, text, button, card, image];
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.elements) || !saved.canvas) return false;
      state.canvas = saved.canvas;
      state.elements = saved.elements;
      state.grid = saved.grid !== false;
      state.snap = saved.snap !== false;
      document.getElementById('projectName').value = saved.projectName || 'Mi diseño';
      return true;
    } catch (error) {
      return false;
    }
  }

  function handleKeyboard(event) {
    const tag = document.activeElement && document.activeElement.tagName;
    const editingText = document.activeElement && document.activeElement.isContentEditable;
    const typing = editingText || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
    const meta = event.ctrlKey || event.metaKey;
    if (editingText) return;
    if (typing) return;
    if (meta && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      state.selectedIds = state.elements.filter(function (element) { return element.visible && !element.locked; }).map(function (element) { return element.id; });
      state.activeId = state.selectedIds[0] || null;
      render();
      return;
    }
    if (meta && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      restoreHistory(event.shiftKey ? state.historyIndex + 1 : state.historyIndex - 1);
      return;
    }
    if (meta && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      restoreHistory(state.historyIndex + 1);
      return;
    }
    if (meta && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelection(); return; }
    if (meta && event.key.toLowerCase() === 'c') { event.preventDefault(); copySelection(); return; }
    if (meta && event.key.toLowerCase() === 'v') {
      if (selectedTableElement()) {
        return;
      }
      event.preventDefault();
      pasteSelection();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedIds.length) { event.preventDefault(); deleteSelection(); return; }
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (arrows[event.key] && state.selectedIds.length) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      selectedElements().forEach(function (element) {
        element.x = clamp(element.x + arrows[event.key][0] * step, 0, state.canvas.width - element.width);
        element.y = clamp(element.y + arrows[event.key][1] * step, 0, state.canvas.height - element.height);
      });
      commitHistory();
      render();
    }
  }

  function bindComponentButtons() {
    document.querySelectorAll('.component-card').forEach(function (button) {
      button.addEventListener('click', function () {
        const index = state.elements.length;
        addElement(button.dataset.component, 60 + (index % 8) * 18, 60 + (index % 8) * 18);
      });
      button.addEventListener('dragstart', function (event) {
        event.dataTransfer.setData('text/plain', button.dataset.component);
        event.dataTransfer.effectAllowed = 'copy';
      });
    });

    canvas.addEventListener('dragover', function (event) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
    canvas.addEventListener('drop', function (event) {
      event.preventDefault();
      const type = event.dataTransfer.getData('text/plain');
      const point = canvasPoint(event);
      addElement(type, point.x, point.y);
    });
  }

  function bindProperties() {
    const mappings = {
      name: 'name', content: 'content', url: 'url', icon: 'icon', x: 'x', y: 'y', width: 'width', height: 'height', rotation: 'rotation',
      bg: 'bg', color: 'color', borderColor: 'borderColor', borderWidth: 'borderWidth', radius: 'radius', opacity: 'opacity', padding: 'padding', shadow: 'shadow',
      fontFamily: 'fontFamily', fontSize: 'fontSize', fontWeight: 'fontWeight', textAlign: 'textAlign', lineHeight: 'lineHeight', letterSpacing: 'letterSpacing', italic: 'italic', objectFit: 'objectFit',
      linkPreset: 'linkPreset', linkDecoration: 'linkDecoration'
    };
    Object.keys(mappings).forEach(function (key) {
      const input = props[key];
      if (!input) return;
      input.addEventListener('input', function () { updateSelectedFromProperty(mappings[key], input.value); scheduleHistory(); });
      input.addEventListener('change', commitHistory);
    });
    props.bgPicker.addEventListener('input', function () { props.bg.value = props.bgPicker.value; updateSelectedFromProperty('bg', props.bg.value); scheduleHistory(); });
    props.colorPicker.addEventListener('input', function () { props.color.value = props.colorPicker.value; updateSelectedFromProperty('color', props.color.value); scheduleHistory(); });
    props.borderPicker.addEventListener('input', function () { props.borderColor.value = props.borderPicker.value; updateSelectedFromProperty('borderColor', props.borderColor.value); scheduleHistory(); });
    props.linkTarget.addEventListener('change', function () { updateSelectedFromProperty('linkTarget', props.linkTarget.checked); commitHistory(); });
  }

  function bindButtons() {
    document.getElementById('btnUndo').addEventListener('click', function () { restoreHistory(state.historyIndex - 1); });
    document.getElementById('btnRedo').addEventListener('click', function () { restoreHistory(state.historyIndex + 1); });
    document.getElementById('btnZoomIn').addEventListener('click', function () { setZoom(state.zoom + 0.1); });
    document.getElementById('btnZoomOut').addEventListener('click', function () { setZoom(state.zoom - 0.1); });
    document.getElementById('btnZoomFit').addEventListener('click', fitCanvas);
    document.getElementById('btnGrid').addEventListener('click', function () { state.grid = !state.grid; commitHistory(); render(); });
    document.getElementById('btnSnap').addEventListener('click', function () { state.snap = !state.snap; commitHistory(); render(); });
    document.getElementById('canvasBg').addEventListener('input', function () { state.canvas.background = this.value; renderCanvasSize(); scheduleHistory(); });
    document.getElementById('canvasBg').addEventListener('change', commitHistory);
    document.getElementById('canvasPreset').addEventListener('change', function () { setPreset(this.value); });
    document.getElementById('canvasWidth').addEventListener('input', function () { setCanvasDimension('width', this.value); });
    document.getElementById('canvasHeight').addEventListener('input', function () { setCanvasDimension('height', this.value); });
    document.getElementById('canvasWidth').addEventListener('change', commitHistory);
    document.getElementById('canvasHeight').addEventListener('change', commitHistory);
    document.getElementById('btnSelectAll').addEventListener('click', function () { state.selectedIds = state.elements.filter(function (element) { return element.visible && !element.locked; }).map(function (element) { return element.id; }); state.activeId = state.selectedIds[0] || null; render(); });
    document.getElementById('btnDuplicate').addEventListener('click', duplicateSelection);
    document.getElementById('btnDelete').addEventListener('click', deleteSelection);
    document.getElementById('btnBringFront').addEventListener('click', function () { moveLayer('front'); });
    document.getElementById('btnSendBack').addEventListener('click', function () { moveLayer('back'); });
    document.getElementById('btnGroupFront').addEventListener('click', function () { moveLayer('front'); });
    document.getElementById('btnGroupBack').addEventListener('click', function () { moveLayer('back'); });
    document.querySelectorAll('[data-align]').forEach(function (button) { button.addEventListener('click', function () { alignSelection(button.dataset.align); }); });
    document.querySelectorAll('[data-table-action]').forEach(function (button) { button.addEventListener('click', function () { tableAction(button.dataset.tableAction); }); });
    document.getElementById('btnPreview').addEventListener('click', openPreview);
    document.getElementById('btnExport').addEventListener('click', openExport);
    document.getElementById('btnImport').addEventListener('click', function () { openModal('importModal'); });
    document.getElementById('btnApplyImport').addEventListener('click', importBodyCode);
    document.getElementById('btnCopyCode').addEventListener('click', async function () {
      const text = document.getElementById('exportCode').value;
      try { await navigator.clipboard.writeText(text); }
      catch (error) { document.getElementById('exportCode').select(); document.execCommand('copy'); }
      showToast('Código copiado.');
    });
    document.getElementById('btnDownloadHtml').addEventListener('click', downloadHtml);
    document.querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', function () { closeModal(button.dataset.closeModal); }); });
    document.querySelectorAll('.sidebar-tab').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('.sidebar-tab').forEach(function (tab) { tab.classList.toggle('active', tab === button); });
        document.getElementById('componentsPanel').classList.toggle('d-none', button.dataset.panelTab !== 'components');
        document.getElementById('layersPanel').classList.toggle('d-none', button.dataset.panelTab !== 'layers');
      });
    });
    document.getElementById('projectName').addEventListener('input', scheduleHistory);
    document.getElementById('projectName').addEventListener('change', commitHistory);
  }

  function init() {
    const restored = restoreLocal();
    if (!restored) createWelcomeDesign();
    commitHistory();
    bindComponentButtons();
    bindProperties();
    bindButtons();
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyboard);
    render();
    setTimeout(fitCanvas, 0);
    state.initialized = true;
  }

  init();
})();
