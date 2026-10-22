/* =============================================
   CORRESPONDANCE Zone → valeurs Ou dans Semis
   ============================================= */
const ZONE_MAP = {
  'Serre':            ['Serre','SerreN','SerreS','SerreE','SerreW','Serre Tipi'],
  'Ext. Serre S':     ['Ext. Serre S'],
  'Ext. Serre E':     ['Ext. Serre E'],
  'Ext. Serre W':     ['Ext. Serre W'],
  'Ext. Serre Clô.':  ['Ext. Serre Clô.'],
  'Ext. Serre Bulle': ['Ext. Serre Bulle'],
  'Ext. Serre Tipi':  ['Ext. Serre Tipi'],
  'Pot.HN':           ['Pot.HN'],
  'Pot.HE':           ['Pot.HE'],
  'Pot.HC':           ['Pot.HC'],
  'Pot.Bulle':        ['Pot.Bulle'],
  'Pot.X-Y':          ['Pot.1-1','Pot.1-2','Pot.1-3','Pot.1-4',
                       'Pot.2-1','Pot.2-2','Pot.2-3','Pot.2-4',
                       'Pot.3-1','Pot.3-2','Pot.3-3','Pot.3-4',
                       'Pot.4-1','Pot.4-2','Pot.4-3','Pot.4-4'],
  'Potager Bas':      ['Pot.B','Pot.BC'],
  'Pot.Table':        ['Pot.Table'],
  'Pot.Prunier':      ['Pot.Prunier'],
  'Bac C angle':      ['Bac C angle'],
  'Bac R milieu':     ['Bac R milieu'],
  'Bac C milieu':     ['Bac C milieu'],
  'Bac R angle':      ['Bac R angle'],
  'Bac terrasse':     ['Bac terrasse'],
  'Grand bac':        ['Grand bac'],
  'Cour 1':           ['Cour 1'],
  'Cour 2':           ['Cour 2'],
  'C. Triangle':      ['C. Triangle'],
  'C. Fosse':         ['C. Fosse'],
  'C. Terrasse':      ['C. Terrasse'],
  'Regard eau':       ['Regard eau'],
  'Séchoir H':        ['Séchoir H','Séchoir HB'],
  'Séchoir B':        ['Séchoir B','Séchoir HB'],
  'Murette':          ['Murette'],
  'Fig.J':            ['Fig.J','Figuier'],
  'Murier':           ['Murier','Prairie murier'],
  'Tipi carré':       ['Tipi carré'],
  'Fontaine':         ['Fontaine'],
  'En pot':           ['En pot','Pot'],
};

/* =============================================
   DÉFINITION DES ZONES
   shape: 'rect'|'ellipse'|'circle'|'trapeze'|'triangle'|'semi-circle'
   w,h en pixels (échelle ~1.3px/cm)
   couleur fill/stroke
   ============================================= */
const ZONES_DEF = [
  // Serre & Ext
  { id:'serre',           label:'Serre',            shape:'rect',        w:234, h:312, fill:'#a5d6a7', stroke:'#00796b', x:300, y:100 },
  { id:'ext-serre-s',     label:'Ext. Serre S',     shape:'rect',        w:234, h:31,  fill:'#a5d6a7', stroke:'#00796b', x:300, y:420 },
  { id:'ext-serre-e',     label:'Ext. Serre E',     shape:'rect',        w:31,  h:312, fill:'#a5d6a7', stroke:'#00796b', x:534, y:100 },
  { id:'ext-serre-w',     label:'Ext. Serre W',     shape:'rect',        w:31,  h:312, fill:'#a5d6a7', stroke:'#00796b', x:269, y:100 },
  { id:'ext-serre-clo',   label:'Ext. Serre Clô.',  shape:'rect',        w:234, h:39,  fill:'#a5d6a7', stroke:'#00796b', x:300, y:55  },
  { id:'ext-serre-bulle', label:'Ext. Serre Bulle', shape:'ellipse',     w:160, h:80,  fill:'#a5d6a7', stroke:'#00796b', x:600, y:200 },
  { id:'ext-serre-tipi',  label:'Ext. Serre Tipi',  shape:'circle',      w:80,  h:80,  fill:'#a5d6a7', stroke:'#00796b', x:600, y:100 },
  // Potager
  { id:'pot-hn',          label:'Pot.HN',            shape:'rect',        w:507, h:78,  fill:'#fffde7', stroke:'#fd9c00', x:600, y:30  },
  { id:'pot-bulle',       label:'Pot.Bulle',         shape:'ellipse',     w:150, h:100, fill:'#fffde7', stroke:'#fd9c00', x:660, y:250 },
  { id:'pot-he',          label:'Pot.HE',            shape:'rect',        w:218, h:273, fill:'#fffde7', stroke:'#fd9c00', x:873, y:108 },
  { id:'pot-hc',          label:'Pot.HC',            shape:'rect',        w:296, h:31,  fill:'#fffde7', stroke:'#fd9c00', x:600, y:459 },
  { id:'potager-grille',  label:'Pot.X-Y',           shape:'grid',        w:350, h:273, fill:'#fffde7', stroke:'#fd9c00', x:600, y:500 },
  { id:'potager-bas',     label:'Potager Bas',       shape:'rect',        w:195, h:195, fill:'#fffde7', stroke:'#fd9c00', x:900, y:400 },
  { id:'pot-table',       label:'Pot.Table',         shape:'rect',        w:78,  h:117, fill:'#fffde7', stroke:'#fd9c00', x:900, y:600 },
  { id:'pot-prunier',     label:'Pot.Prunier',       shape:'ellipse',     w:200, h:120, fill:'#fffde7', stroke:'#fd9c00', x:1000, y:600 },
  // Bacs
  { id:'bac-c-angle',     label:'Bac C angle',       shape:'rect',        w:125, h:125, fill:'#81d4fa', stroke:'#029ef8', x:1150, y:100 },
  { id:'bac-r-milieu',    label:'Bac R milieu',      shape:'trapeze',     w:50,  h:140, fill:'#81d4fa', stroke:'#029ef8', x:1150, y:230 },
  { id:'bac-c-milieu',    label:'Bac C milieu',      shape:'trapeze',     w:160, h:150, fill:'#81d4fa', stroke:'#029ef8', x:1210, y:230 },
  { id:'bac-r-angle',     label:'Bac R angle',       shape:'rect',        w:117, h:78,  fill:'#81d4fa', stroke:'#029ef8', x:1150, y:385 },
  { id:'grand-bac',       label:'Grand bac',         shape:'trapeze',     w:318, h:150, fill:'#81d4fa', stroke:'#029ef8', x:1150, y:600 },
  // Cour & alentours
  { id:'cour1',           label:'Cour 1',            shape:'rect',        w:160, h:47,  fill:'#bcaaa4', stroke:'#795548', x:50,  y:500 },
  { id:'cour2',           label:'Cour 2',            shape:'rect',        w:160, h:47,  fill:'#bcaaa4', stroke:'#795548', x:50,  y:550 },
  { id:'cour-tri',        label:'C. Triangle',       shape:'triangle',    w:120, h:93,  fill:'#bcaaa4', stroke:'#795548', x:50,  y:547 },
  { id:'c-fosse',         label:'C. Fosse',          shape:'rect',        w:160, h:234, fill:'#bcaaa4', stroke:'#795548', x:50,  y:650 },
  { id:'c-terrasse',      label:'C. Terrasse',       shape:'rect',        w:155, h:234, fill:'#bcaaa4', stroke:'#795548', x:215, y:650 },
  { id:'regard-eau',      label:'Regard eau',        shape:'rect',        w:320, h:78,  fill:'#bcaaa4', stroke:'#795548', x:50,  y:547 },
  { id:'bac-terrasse',    label:'Bac terrasse',      shape:'rect',        w:234, h:117, fill:'#bcaaa4', stroke:'#795548', x:1150, y:470 },
  { id:'murette',         label:'Murette',           shape:'rect',        w:273, h:30,  fill:'#bcaaa4', stroke:'#795548', x:600, y:490 },

  // Séchoir
  { id:'sechoir-h',       label:'Séchoir H',         shape:'circle',      w:120, h:120, fill:'#ffe082', stroke:'#f57f17', x:100, y:400 },
  { id:'sechoir-b',       label:'Séchoir B',         shape:'semi-circle', w:100, h:70,  fill:'#ffe082', stroke:'#f57f17', x:60,  y:465 },
  // Divers
  { id:'tipi-carre',      label:'Tipi carré',        shape:'rect',        w:31,  h:31,  fill:'#ce93d8', stroke:'#6a1b9a', x:873, y:459 },
  { id:'fontaine',        label:'Fontaine',          shape:'rect',        w:156, h:47,  fill:'#80deea', stroke:'#00838f', x:600, y:800 },
  { id:'figuier',         label:'Fig.J',             shape:'circle',      w:60,  h:60,  fill:'#ce93d8', stroke:'#6a1b9a', x:1400, y:200 },
  { id:'murier',          label:'Murier',            shape:'ellipse',     w:230, h:80,  fill:'#ce93d8', stroke:'#6a1b9a', x:1380, y:300 },
  { id:'en-pot',          label:'En pot',            shape:'rect',        w:120, h:80,  fill:'#f5f5f5', stroke:'#999',    x:1400, y:500 },
];
/* =============================================
   COULEURS DES ÉTIQUETTES SELON LE TYPE DE CULTURE
   Le type est reconnu grâce à son emoji, ce qui évite les
   problèmes d'espaces ou d'accents dans le texte du type.
   fond = pastel, bord = même teinte plus foncée
   ============================================= */
const COULEURS_TYPE = [
  { emoji: '🌼', nom: 'Fleurs',        fond: '#fff59d', bord: '#f9a825' }, // jaune
  { emoji: '🥬', nom: 'Lég-feu.',      fond: '#c8e6c9', bord: '#388e3c' }, // vert
  { emoji: '🌿', nom: 'Arom.Méd',      fond: '#bbdefb', bord: '#1976d2' }, // bleu
  { emoji: '🍅', nom: 'Lég-fru.',      fond: '#ffcdd2', bord: '#d32f2f' }, // rouge
  { emoji: '🌾', nom: 'Lég-gra.',      fond: '#ffe0b2', bord: '#f57c00' }, // orange
  { emoji: '🥕', nom: 'Lég-rac.',      fond: '#e1bee7', bord: '#8e24aa' }, // violet
  { emoji: '🫐', nom: 'Petits Fruits', fond: '#fdcbdd', bord: '#f80f64' }, // rose
  { emoji: '🧅', nom: 'Tub.bul.',      fond: '#d7ccc8', bord: '#6d4c41' }  // marron
];

// Pas de type, ou type inconnu : gris
const COULEUR_DEFAUT = { fond: '#eeeeee', bord: '#9e9e9e' };

function couleurType(type) {
  if (!type) return COULEUR_DEFAUT;
  const t = String(type);
  return COULEURS_TYPE.find(c => t.includes(c.emoji)) || COULEUR_DEFAUT;
}
/* =============================================
   ÉTAT
   ============================================= */
let mode         = 'view';   // 'view' | 'edit' | 'plant'
let zoneActive   = null;
let records      = [];
let recordsParId = new Map();   // id de la ligne Semis → enregistrement
let placements = [];             // [{ uid, pid, x, y }]  pid = id de la ligne Semis
let nextUid = 1;
let modifie = false;      // vrai tant que des changements ne sont pas sauvegardés
let etiquetteChoisie = null;   // id de la ligne Semis choisie dans le panneau (pose en 2 touches)
let messageJusqua = 0;   // tant que Date.now() est inférieur, un message temporaire reste affiché

function majStatut() {
  if (Date.now() < messageJusqua) return;
  const el = document.getElementById('status');
  el.textContent = (modifie ? '● Non sauvegardé — ' : '') + records.length + ' plantes';
  el.classList.toggle('non-sauve', modifie);
}             
const LIMITE_PAR_PLANTES = true; // false = autant d'étiquettes qu'on veut par ligne
 
function placementsDe(pid) {
  return placements.filter(p => p.pid === pid);
}
function pieds(p) { return Math.max(1, parseInt(p.n) || 1); }

function piedsPlaces(pid) {
  return placementsDe(pid).reduce((s, p) => s + pieds(p), 0);
}

function resteAPlacer(r) {
  return maxPlacements(r) - piedsPlaces(r.id);
}

// Double-clic sur une étiquette : change son nombre de pieds
function modifierNombre(uid) {
  const p = placements.find(x => x.uid === uid);
  const r = p && recordsParId.get(p.pid);
  if (!r) return;
  const max = maxPlacements(r) - (piedsPlaces(p.pid) - pieds(p));  // quota dispo pour cette étiquette
  const rep = prompt('Nombre de pieds pour cette étiquette' +
                     (Number.isFinite(max) ? ' (max ' + max + ')' : '') + ' :', pieds(p));
  if (rep === null) return;
  const n = parseInt(rep);
  if (!(n >= 1)) return;
  p.n = Number.isFinite(max) ? Math.min(n, Math.max(1, max)) : n;
  modifie = true;
  renderPlants();
  renderPanel();
}
 
function maxPlacements(r) {
  if (!LIMITE_PAR_PLANTES) return Infinity;
  return Math.max(1, parseInt(r.Plantes) || 0);
}
 
// Positions enregistrées pour une ligne Semis : [{x, y}, ...]
function lirePositions(r) {
  let liste = [];
  if (r.Positions) {
    try {
      const j = JSON.parse(r.Positions);
      if (Array.isArray(j)) {
        liste = j.filter(p => p && isFinite(p.x) && isFinite(p.y));
      }
    } catch (e) {
      console.warn('Positions illisibles, ligne', r.id, e);
    }
  }
    return liste;
}
 
function echapper(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

let zonePos      = {};       // id zone → {x,y,rot,w,h}  (depuis Grist Plan)
let planRecords  = [];       // lignes de la table Plan

// Drag état
let drag = null;

// Pan état
let pan = { active:false, startX:0, startY:0, ox:0, oy:0, x:0, y:0 };
let scale = 1;

const NB_CAR_MAX = 12;        // longueur maximale du nom et de la variété
let tailleEtiquettes = 1;     // facteur de taille commun à toutes les étiquettes
                              // (ne pas l'appeler "scale" : c'est le zoom du plan)
 
 /* =============================================
   GRIST
   ============================================= */
grist.ready({ requiredAccess: 'full' });

grist.onRecords(async function(recs) {
  // Charger les plantes depuis Semis
  records = recs.filter(r => (r.Plantes > 0) || r.A_produire);
  records = recs.filter(r => (r.Plantes > 0) || r.A_produire);
  recordsParId = new Map(records.map(r => [r.id, r]));

  if (!modifie) {   // on ne touche pas aux étiquettes ni aux zones tant que tout n'est pas sauvegardé
    placements = [];
    records.forEach(r => {
      lirePositions(r).forEach(p => {
        placements.push({ uid: nextUid++, pid: r.id, x: p.x, y: p.y, n: p.n });
      });
    });

    // Charger les positions des zones depuis Plan
    try {
      const planData = await grist.docApi.fetchTable('Plan');
      planRecords = planData.id.map((id, i) => ({
        id, Zone: planData.Zone?.[i] || '',
        X: planData.X?.[i] || 0, Y: planData.Y?.[i] || 0,
        Rotation: planData.Rotation?.[i] || 0,
        Largeur: planData.Largeur?.[i] || 0,
        Hauteur: planData.Hauteur?.[i] || 0,
      }));
      // Appliquer les positions sauvegardées
      planRecords.forEach(pr => {
        const z = ZONES_DEF.find(z => z.label === pr.Zone);
        if (!z) return;
        zonePos[z.id] = {
          x: pr.X || z.x, y: pr.Y || z.y,
          rot: pr.Rotation || 0,
          w: pr.Largeur || z.w,
          h: pr.Hauteur || z.h,
        };
      });
    } catch (e) {
      console.warn('Table Plan non trouvée, utilisation des positions par défaut');
    }
  }

  majStatut()/*document.getElementById('status').textContent = records.length + ' plantes';
  */renderAll();
});

/* =============================================
   MODE
   ============================================= */
function setMode(m) {
  mode = m;
  const badge = document.getElementById('mode-badge');
  const vp    = document.getElementById('viewport');
  if (m === 'edit') {
    badge.className = 'mode-badge mode-edit';
    badge.textContent = 'ÉDITION ZONES';
    vp.classList.add('edit-mode');
    document.getElementById('zone-label').textContent = '✏️ Glisser les zones · Clic droit = pivoter';
  } else if (m === 'plant') {
    badge.className = 'mode-badge mode-plant';
    badge.textContent = 'PLACEMENT PLANTES';
    vp.classList.remove('edit-mode');
    document.getElementById('zone-label').textContent = '🌱 Cliquer zone puis glisser plante';
  } else if (m === 'select') {
    badge.className = 'mode-badge mode-select';
    badge.textContent = 'SÉLECTION';
    vp.classList.add('edit-mode');
    document.getElementById('zone-label').textContent = '⬚ Tracer un rectangle, puis glisser la sélection';
    } else {
    badge.className = 'mode-badge mode-view';
    badge.textContent = 'VUE';
    vp.classList.remove('edit-mode');
    document.getElementById('zone-label').textContent = 'Cliquer sur une zone';
  }
  if (m !== 'select') { selection.zones.clear(); selection.plants.clear(); }
  if (m !== 'plant') etiquetteChoisie = null;
  renderAll();
}

/* =============================================
   RENDU ZONES
   ============================================= */
function getZoneState(z) {
  return zonePos[z.id] || { x: z.x, y: z.y, rot: 0, w: z.w, h: z.h };
}

function makeShape(z, st) {
  const cx = st.w / 2, cy = st.h / 2;
  switch(z.shape) {
    case 'rect':
    case 'grid':
      return `<rect x="0" y="0" width="${st.w}" height="${st.h}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    case 'ellipse':
      return `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${cx}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    case 'trapeze':
      // trapèze : angles droits en haut, incliné en bas
      return `<polygon points="0,0 ${st.w},0 ${st.w},${st.h} 0,${st.h*0.85}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    /*case 'trapeze2':
      // trapèze : grande base en haut, petite en bas
      const off = Math.round((st.w - st.w*0.75)/2);
      return `<polygon points="0,0 ${st.w},0 ${st.w-off},${st.h} ${off},${st.h}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;*/
    case 'triangle':
      return `<polygon points="0,0 ${st.w},0 0,${st.h}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    case 'semi-circle':
      return `<path d="M0,0 A${cx},${st.h} 0 0,1 ${st.w},0 Z"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
    default:
      return `<rect x="0" y="0" width="${st.w}" height="${st.h}"
                fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" class="zone-shape"/>`;
  }
}

function makeGrid(z, st) {
  if (z.shape !== 'grid') return '';
  const cw = st.w/4, ch = st.h/4;
  let lines = '';
  for(let i=1;i<4;i++) {
    lines += `<line x1="${i*cw}" y1="0" x2="${i*cw}" y2="${st.h}" stroke="${z.stroke}" stroke-width="0.7" opacity="0.5"/>`;
    lines += `<line x1="0" y1="${i*ch}" x2="${st.w}" y2="${i*ch}" stroke="${z.stroke}" stroke-width="0.7" opacity="0.5"/>`;
  }
  // Labels
  const cols=['1','2','3','4'], rows=['4','3','2','1'];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
    lines += `<text x="${c*cw+3}" y="${r*ch+12}" font-size="7" fill="#bbb" font-family="Arial">${cols[c]}-${rows[r]}</text>`;
  }
  return lines;
}

function renderZones() {
  const layer = document.getElementById('zones-layer');
  layer.innerHTML = '';
  ZONES_DEF.forEach(z => {
    const st  = getZoneState(z);
    const sel = zoneActive === z.label;
    const g   = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id      = 'zg-' + z.id;
    g.classList.add('zone-group');
    if (sel) g.classList.add('selected');
    if (mode === 'edit') g.classList.add('edit-handle');
    if (selection.zones.has(z.id)) g.classList.add('en-selection');
  

    g.setAttribute('transform',
      `translate(${st.x},${st.y}) rotate(${st.rot},${st.w/2},${st.h/2})`);

    g.innerHTML = makeShape(z, st) + makeGrid(z, st);

    // Poignée de rotation (visible en mode edit)
    if (mode === 'edit') {
      g.innerHTML += `
        <circle class="rot-handle" cx="${st.w}" cy="0" r="6"
          data-id="${z.id}" <title>Pivoter</title>`;
    }

    // Événements
    g.addEventListener('pointerdown', e => onZoneMouseDown(e, z));
    g.addEventListener('contextmenu', e => { e.preventDefault(); rotateZone(z.id, 15); });

    layer.appendChild(g);
    });
    renderNoms(majStatut());
}

function rotateZone(zid, deg) {
  if (mode !== 'edit') return;
  const z  = ZONES_DEF.find(x => x.id === zid);
  const st = getZoneState(z);
  zonePos[zid] = { ...st, rot: (st.rot + deg) % 360 };
  modifie = true
  renderZones();
}

const TAILLE_NOM = 9;             // en unités du plan (≈ 14 px à l'écran à zoom 100 %)
const ALIGNEMENT_NOM = 'gauche';  // 'gauche' | 'centre'

function renderNoms() {
  const layer = document.getElementById('names-layer');
  if (!layer) return;
  let html = '';
  ZONES_DEF.forEach(z => {
    const b = boiteZone(z.id);
    const centre = ALIGNEMENT_NOM === 'centre';
    const x = centre ? (b.x0 + b.x1) / 2 : b.x0;
    const y = Math.max(TAILLE_NOM, b.y0 - 3);   // jamais en dehors du haut du plan
    html += `<text x="${x}" y="${y}" font-size="${TAILLE_NOM}" font-weight="bold"
      font-family="Arial" text-anchor="${centre ? 'middle' : 'start'}"
      fill="${z.stroke}" stroke="#fff" stroke-width="3" stroke-linejoin="round"
      paint-order="stroke">${echapper(z.label)}</text>`;
  });
  layer.innerHTML = html;
  majStatut()
}

function transformEtiquette(p) {
  return `translate(${p.x},${p.y}) scale(${tailleEtiquettes / FACTEUR_PLAN})`;
}

/* =============================================
   RENDU PLANTES
   ============================================= */
function renderPlants() {
  const layer = document.getElementById('plants-layer');
  layer.innerHTML = '';
 
  placements.forEach(p => {
    const r = recordsParId.get(p.pid);
    if (!r) return;
 
    const { nom, var_, w, h } = dimensionsEtiquette(r);
 
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('placed-label');
    if (selection.plants.has(p.uid)) g.classList.add('en-selection');
    const c = couleurType(r.Type);
    g.style.setProperty('--fond', c.fond);
    g.style.setProperty('--bord', c.bord);
    g.dataset.uid = p.uid;
    g.setAttribute('transform', transformEtiquette(p));
 
    g.innerHTML = `
      <title>${echapper(r.Nom)} — ${echapper(r.Variete)}</title>
      <rect x="0" y="0" width="${w}" height="${h}" rx="2" stroke-width="1"/>
      <text x="3" y="10" font-size="8" font-weight="bold" font-family="Arial" fill="#333">${echapper(nom)}</text>
      ${var_ ? `<text x="3" y="20" font-size="7" font-style="italic" font-family="Arial" fill="#555">${echapper(var_)}</text>` : ''}
      <text x="${w - 9}" y="9" font-size="11" fill="#c62828" font-family="Arial"
            style="cursor:pointer" data-remove="${p.uid}">×</text>
            ${pieds(p) > 1 ? `
  <circle cx="${w}" cy="${h}" r="7" fill="#000000"/>
  <text x="${w}" y="${h + 3}" font-size="8" font-weight="bold" font-family="Arial"
        fill="#fff" text-anchor="middle" pointer-events="none">${pieds(p)}</text>` : ''}`; 
            
 
    g.addEventListener('pointerdown', e => {
      if (e.target.dataset.remove) { removePlacement(parseInt(e.target.dataset.remove)); return; }
      if (mode === 'select') { demarrerDeplacementSelection(e, 'plant', p.uid); return; }
      if (mode !== 'plant') return;
      onPlantMouseDown(e, p.uid);
    });
    g.addEventListener('dblclick', () => { if (mode === 'plant') modifierNombre(p.uid); });
    layer.appendChild(g);
  });
  majStatut()
}


function removePlacement(uid) {
  placements = placements.filter(p => p.uid !== uid);
  modifie = true;
  renderPlants();
  renderPanel();
}

function renderAll() { renderZones(); renderPlants(); renderPanel(); renderSelection(); }

/* =============================================
   PANEL
   ============================================= */
function renderPanel() {
  const list   = document.getElementById('panel-list');
  const search = (document.getElementById('search').value || '').toLowerCase();
  const ouOk   = zoneActive ? (ZONE_MAP[zoneActive] || [zoneActive]) : null;
 
  const filtered = records.filter(r => {
    const txt = ((r.Nom || '') + ' ' + (r.Variete || '')).toLowerCase();
    if (!txt.includes(search)) return false;
    if (!ouOk) return true;
    const vals = Array.isArray(r.Ou) ? r.Ou : (r.Ou ? [r.Ou] : []);
    return vals.some(v => ouOk.includes(v));
  });
 
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<div style="color:#aaa;font-size:9px;padding:6px;text-align:center">Aucune plante</div>';
    return;
  }
 
  filtered.forEach(r => {
    const nbPlaces = piedsPlaces(r.id);
const nbMax    = maxPlacements(r);
const complet  = resteAPlacer(r) <= 0;
 
    const div = document.createElement('div');
    div.className = 'etiquette-item' + (complet ? ' placed' : '');
    const c = couleurType(r.Type);
    div.style.setProperty('--fond', c.fond);
    div.style.setProperty('--bord', c.bord);
    div.dataset.id = r.id;
    if (r.id === etiquetteChoisie) div.classList.add('choisie');
div.addEventListener('click', () => {
  if (mode !== 'plant' || complet) return;
  etiquetteChoisie = (etiquetteChoisie === r.id) ? null : r.id;   // re-toucher = désélectionner
  renderPanel();
});
 
    const ouStr = Array.isArray(r.Ou) ? r.Ou.join(', ') : (r.Ou || '');
    const compteur = (Number.isFinite(nbMax) && nbMax > 1)
      ? `<span class="compteur">${nbPlaces}/${nbMax}</span>` : '';
 
    div.innerHTML = `<div class="nom">${echapper(r.Nom)}${compteur}</div>
      <div class="var">${echapper(r.Variete)}</div>
      ${ouStr ? `<div class="ou">📍 ${echapper(ouStr)}</div>` : ''}`;
 
    if (!complet && mode === 'plant') {
      div.draggable = true;
      div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('plantId', r.id);
      });
    }
    list.appendChild(div);
  });
}


/* =============================================
   DRAG ZONES (mode edit)
   ============================================= */
function onZoneMouseDown(e, z) {
  if (mode === 'plant' && etiquetteChoisie) return;
  if (mode === 'select') { demarrerDeplacementSelection(e, 'zone', z.id); return; }
  if (mode !== 'edit') {
    // Mode view/plant → sélection de zone
    zoneActive = z.label;
    document.getElementById('zone-label').textContent = '📍 ' + z.label;
    renderZones();
    renderPanel();
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  // Clic sur poignée rotation ?
  if (e.target.classList.contains('rot-handle')) {
    rotateZone(z.id, 15);
    return;
  }
  const st = getZoneState(z);
  const pt  = svgPoint(e, svg);
  drag = { type:'zone', zid: z.id, startX: pt.x, startY: pt.y, origX: st.x, origY: st.y };
}

function onPlantMouseDown(e, uid) {
  if (mode !== 'plant') return;
  e.preventDefault();
  const p = placements.find(x => x.uid === uid);
  if (!p) return;
  const pt  = svgPoint(e, svg);
  drag = { type: 'plant', uid, startX: pt.x, startY: pt.y, origX: p.x, origY: p.y };
}


/* =============================================
   PAN + DRAG global
   ============================================= */
const svg = document.getElementById('plan');
const vp  = document.getElementById('viewport');

// Drop depuis panel
svg.addEventListener('dragover', e => { if (mode === 'plant') e.preventDefault(); });
function poserEtiquette(id, pt) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  const reste = resteAPlacer(r);
  if (reste <= 0) return;

  const np = { uid: nextUid++, pid: id, x: Math.round(pt.x), y: Math.round(pt.y), n: 1 };
  placements.push(np);
  limiterAuPlan(np);

  if (reste > 1) {
    const info = Number.isFinite(reste) ? ' (reste ' + reste + ')' : '';
    const n = parseInt(prompt('Combien de pieds à cet endroit ?' + info, 1));
    if (n >= 1) np.n = Number.isFinite(reste) ? Math.min(n, reste) : n;
  }
  modifie = true;
  renderPlants();
  renderPanel();
}
svg.addEventListener('drop', e => {
  if (mode !== 'plant') return;
  e.preventDefault();
  const id = parseInt(e.dataTransfer.getData('plantId'));
  if (!id) return;
  poserEtiquette(id, svgPoint(e, svg));
});
svg.addEventListener('click', e => {
  if (mode !== 'plant' || !etiquetteChoisie) return;
  if (e.target.closest('.placed-label')) return;   // un clic sur une étiquette ne pose rien
  poserEtiquette(etiquetteChoisie, svgPoint(e, svg));
  const r = records.find(x => x.id === etiquetteChoisie);
  if (!r || resteAPlacer(r) <= 0) etiquetteChoisie = null;   // quota atteint : on désélectionne
  renderPanel();
});


// Pan (milieu souris ou mode vue)
vp.addEventListener('pointerdown', e => {
  if (drag || pointeurs.size >= 2) return;
  if (e.button !== 1 && mode !== 'view') return;  if (e.button !== 1 && mode === 'plant') return; // plant mode: pan seulement bouton milieu
  pan.active = true;
  pan.startX = e.clientX; pan.startY = e.clientY;
  pan.ox = pan.x; pan.oy = pan.y;
  vp.classList.add('grabbing');
});
window.addEventListener('pointermove', e => {
  if (!pan.active || pincement) return;
  pan.x = pan.ox + e.clientX - pan.startX;
  pan.y = pan.oy + e.clientY - pan.startY;
  applyTransform();
});
window.addEventListener('pointerup', () => {
  pan.active = false;
  vp.classList.remove('grabbing');
});

// Zoom molette
vp.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale = Math.min(3, Math.max(0.2, scale * delta));
  applyTransform();
}, { passive: false });

const pointeurs = new Map();   // doigts posés : id → {x, y}
let pincement = null;          // état du geste à deux doigts

function mesurerDoigts() {
  const [a, b] = [...pointeurs.values()];
  return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
           d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
}

// true : cet écouteur passe AVANT les autres (certains font stopPropagation)
vp.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointeurs.size === 2) {
    const m = mesurerDoigts();
    pincement = { d: m.d, cx: m.cx, cy: m.cy, scale, px: pan.x, py: pan.y };
    drag = null;                 // le 2e doigt annule un glissement en cours
    pan.active = false;
    vp.classList.remove('grabbing');
  }
}, true);

window.addEventListener('pointermove', e => {
  if (!pointeurs.has(e.pointerId)) return;
  pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!pincement || pointeurs.size < 2) return;

  const m = mesurerDoigts();
  const r = vp.getBoundingClientRect();
  const s = Math.min(3, Math.max(0.2, pincement.scale * m.d / pincement.d));
  const k = s / pincement.scale;
  // le point du plan qui était sous les doigts y reste
  pan.x = (m.cx - r.left) - ((pincement.cx - r.left) - pincement.px) * k;
  pan.y = (m.cy - r.top)  - ((pincement.cy - r.top)  - pincement.py) * k;
  scale = s;
  applyTransform();
});

function finDoigt(e) {
  pointeurs.delete(e.pointerId);
  if (pointeurs.size < 2) pincement = null;
}
window.addEventListener('pointerup', finDoigt);
window.addEventListener('pointercancel', finDoigt);

function applyTransform() {
  svg.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${scale})`;
}

function zoomIn()    { scale = Math.min(3, scale * 1.2); applyTransform(); }
function zoomOut()   { scale = Math.max(0.2, scale * 0.8); applyTransform(); }
function zoomReset() {  ajusterZoom();
}


// Pendant le glissement du curseur : redessine seulement
function changerTaille(valeur) {
  tailleEtiquettes = valeur / 100;
  renderPlants();
}
 
// Quand on relâche le curseur : mémorise la taille dans les options du widget Grist
function sauverTaille(valeur) {
  grist.setOption('tailleEtiquettes', valeur / 100);
}
 
// Au chargement : relit la taille mémorisée
grist.onOptions(function (options) {
  if (options && options.tailleEtiquettes) {
    tailleEtiquettes = options.tailleEtiquettes;
    const curseur = document.getElementById('taille-etiq');
    if (curseur) curseur.value = Math.round(tailleEtiquettes * 100);
    renderPlants();
  }
});

function svgPoint(e, svgEl) {
  const rect = svgEl.getBoundingClientRect();
  const vb = svgEl.viewBox.baseVal;
  return {
    x: (e.clientX - rect.left) * vb.width  / rect.width,
    y: (e.clientY - rect.top)  * vb.height / rect.height,
  };
}


/* =============================================
   SAUVEGARDE
   ============================================= */
async function sauvegarder() {
  document.getElementById('status').textContent = 'Sauvegarde…';
  document.getElementById('status').textContent = 'Sauvegarde…';
messageJusqua = Infinity;
  try {
    const actions = [];

    // Positions zones → table Plan
    ZONES_DEF.forEach(z => {
      const st  = getZoneState(z);
      const pr  = planRecords.find(p => p.Zone === z.label);
      if (pr) {
        actions.push(['UpdateRecord','Plan', pr.id, {
          X: Math.round(st.x), Y: Math.round(st.y),
          Rotation: st.rot, Largeur: st.w, Hauteur: st.h
        }]);
      } else {
        actions.push(['AddRecord','Plan', null, {
          Zone: z.label,
          X: Math.round(st.x), Y: Math.round(st.y),
          Rotation: st.rot, Largeur: st.w, Hauteur: st.h
        }]);
      }
    });

    // Étiquettes des plantes → table Semis (colonne Positions)
    const parPlante = {};
    placements.forEach(p => {
      (parPlante[p.pid] = parPlante[p.pid] || []).push({
  x: Math.round(p.x), y: Math.round(p.y), n: pieds(p)
});
    });
 
    Object.entries(parPlante).forEach(([id, liste]) => {
      actions.push(['UpdateRecord', 'Semis', parseInt(id), {
    Positions: JSON.stringify(liste)
      }]);
    });
 
    records.forEach(r => {
  if (!parPlante[r.id] && r.Positions) {
    actions.push(['UpdateRecord', 'Semis', r.id, { Positions: null }]);
  }
});


    await grist.docApi.applyUserActions(actions);
    modifie = false
    // Recharger planRecords
    const planData = await grist.docApi.fetchTable('Plan');
    planRecords = planData.id.map((id,i) => ({
      id, Zone: planData.Zone?.[i]||'',
      X: planData.X?.[i]||0, Y: planData.Y?.[i]||0,
      Rotation: planData.Rotation?.[i]||0,
      Largeur: planData.Largeur?.[i]||0,
      Hauteur: planData.Hauteur?.[i]||0,
    }));

        document.getElementById('status').textContent = '✅ Sauvegardé !';
    messageJusqua = Date.now() + 2000;
    setTimeout(majStatut, 2100);
  } catch (err) {
    document.getElementById('status').textContent = '❌ ' + err.message;
    messageJusqua = Date.now() + 8000;
  }
}
function resetPlantes() {
  if (!confirm('Réinitialiser les positions des plantes ?')) return;
  placements = [];
  modifie = true;
  renderPlants();
  renderPanel();
}
/* =============================================
   IMPRESSION A3 PAYSAGE + LIGNES DE COUPE
   Échelle 100 % = taille de l'écran (96 px par pouce).
   Zone utile d'une feuille : 400 x 276 mm (A3 moins 10 mm de marge,
   1 mm de sécurité en hauteur pour éviter une page blanche).
   Plan de 2000 x 1600 px  ->  2 colonnes x 2 lignes = 4 feuilles.
   ============================================= */
const A3_LARGEUR_MM = 420;
const A3_HAUTEUR_MM = 297;
const MARGE_MM = 10;
const MM_EN_PX = 96 / 25.4;
 
const PAGE_W_MM = A3_LARGEUR_MM - 2 * MARGE_MM;       // 400
const PAGE_H_MM = A3_HAUTEUR_MM - 2 * MARGE_MM - 1;   // 276
const PAGE_W = PAGE_W_MM * MM_EN_PX;                  // ~1511,8 px
const PAGE_H = PAGE_H_MM * MM_EN_PX;                  // ~1043,1 px
 
const NB_COL = 2;                                     // 2 feuilles de large
const NB_LIG = 2;                                     // 2 feuilles de haut
 
/* Agrandissement des zones par rapport aux coordonnées enregistrées.
   1,3 : tout l'ancien plan (2000 x 1600) reste visible, avec des zones
         30 % plus grandes.
   1,5 : zones plus grandes encore, mais ce qui se trouvait au-delà de
         x = 2016 ou y = 1391 (anciennes coordonnées) sort de la surface.
   1   : aucun agrandissement.
   Les données (Plan, Semis) ne sont jamais modifiées par ce réglage. */
const FACTEUR_PLAN = 1.6;
 
const LARGEUR_PX = NB_COL * PAGE_W;      // surface de travail affichée, en px écran
const HAUTEUR_PX = NB_LIG * PAGE_H;
const PLAN_W = LARGEUR_PX / FACTEUR_PLAN; // même surface, en unités du plan
const PLAN_H = HAUTEUR_PX / FACTEUR_PLAN;
const TUILE_W = PAGE_W / FACTEUR_PLAN;    // une feuille, en unités du plan
const TUILE_H = PAGE_H / FACTEUR_PLAN;
 
let coupuresVisibles = false;
 
/* ---------------------------------------------
   Taille de la surface de travail (appelée au chargement)
   --------------------------------------------- */
function initTailleDuPlan() {
  const s = document.getElementById('plan');
  s.setAttribute('width', LARGEUR_PX);
  s.setAttribute('height', HAUTEUR_PX);
  s.setAttribute('viewBox', `0 0 ${PLAN_W} ${PLAN_H}`);
 
  // La grille de fond remplit toute la surface
  const fond = s.querySelector('rect[fill="url(#grid)"]');
  if (fond) {
    fond.setAttribute('width', '100%');
    fond.setAttribute('height', '100%');
  }
  ajusterZoom();
}
 
/* Zoom qui fait tenir toute la surface de travail dans la fenêtre */
function ajusterZoom() {
  const viewport = document.getElementById('viewport');
  scale = Math.min(viewport.clientWidth / LARGEUR_PX, viewport.clientHeight / HAUTEUR_PX, 1);
  pan.x = 0;
  pan.y = 0;
  applyTransform();
}
 
/* ---------------------------------------------
   Lignes de coupe visibles à l'écran (bouton "Coupures A3")
   --------------------------------------------- */
function renderCoupures() {
  const layer = document.getElementById('cuts-layer');
  layer.innerHTML = '';
  if (!coupuresVisibles) return;
 
  let html = '';
 
  for (let c = 1; c < NB_COL; c++) {
    const x = c * TUILE_W;
    html += `<line class="coupure" x1="${x}" y1="0" x2="${x}" y2="${PLAN_H}"/>`;
  }
  for (let l = 1; l < NB_LIG; l++) {
    const y = l * TUILE_H;
    html += `<line class="coupure" x1="0" y1="${y}" x2="${PLAN_W}" y2="${y}"/>`;
  }
 
  // Numéro de chaque feuille, dans son coin haut-gauche
  let n = 1;
  for (let l = 0; l < NB_LIG; l++) {
    for (let c = 0; c < NB_COL; c++) {
      html += `<text class="coupure-label" x="${c * TUILE_W + 6}" y="${l * TUILE_H + 34}">Feuille ${n}/${NB_COL * NB_LIG}</text>`;
      n++;
    }
  }
  layer.innerHTML = html;
}
 
function toggleCoupures() {
  coupuresVisibles = !coupuresVisibles;
  renderCoupures();
}
 
/* ---------------------------------------------
   Impression : une page A3 par feuille, chacune étant une
   "fenêtre" sur la bonne partie du plan (un navigateur ne sait
   pas découper un dessin large en pages sur la largeur).
   --------------------------------------------- */
function imprimerA3() {
  const root = document.getElementById('print-root');
  root.innerHTML = '';
 
  let n = 1;
  for (let l = 0; l < NB_LIG; l++) {
    for (let c = 0; c < NB_COL; c++) {
      const x0 = c * TUILE_W;
      const y0 = l * TUILE_H;
 
      const page = document.createElement('div');
      page.className = 'page-a3';
 
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('width', PAGE_W_MM + 'mm');
      s.setAttribute('height', PAGE_H_MM + 'mm');
      s.setAttribute('viewBox', `${x0} ${y0} ${TUILE_W} ${TUILE_H}`);
 
      // Copie des zones et des étiquettes, sans les poignées ni les croix de suppression
      ['zones-layer', 'plants-layer', 'names-layer'].forEach(idCalque => {        const copie = document.getElementById(idCalque).cloneNode(true);
        copie.removeAttribute('id');
        copie.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        copie.querySelectorAll('.rot-handle, [data-remove]').forEach(el => el.remove());
        copie.querySelectorAll('.selected, .edit-handle, .en-selection').forEach(el => {
  el.classList.remove('selected', 'edit-handle', 'en-selection');
});
        s.appendChild(copie);
      });
 
      // Repère pour assembler les feuilles
      const repere = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      repere.setAttribute('x', x0 + 6);
      repere.setAttribute('y', y0 + TUILE_H - 6);
      repere.setAttribute('font-size', '8');
      repere.setAttribute('font-family', 'Arial');
      repere.setAttribute('fill', '#999');
      repere.textContent = `Feuille ${n}/${NB_COL * NB_LIG}`;
      s.appendChild(repere);
 
      page.appendChild(s);
      root.appendChild(page);
      n++;
    }
  }
 
  // Format de page A3 paysage, uniquement pour cette impression
  const style = document.createElement('style');
  style.id = 'style-a3';
  style.textContent = '@page { size: 420mm 297mm; margin: ' + MARGE_MM + 'mm; }';
  document.head.appendChild(style);
  document.body.classList.add('imprimer-a3');
 
  window.print();
}
 
// Nettoyage une fois l'impression terminée ou annulée
window.addEventListener('afterprint', function () {
  document.body.classList.remove('imprimer-a3');
  const style = document.getElementById('style-a3');
  if (style) style.remove();
  const root = document.getElementById('print-root');
  if (root) root.innerHTML = '';
});
 
// Mise en place de la surface de travail au chargement
initTailleDuPlan();
/* ---------------------------------------------
   État de la sélection
   --------------------------------------------- */
let selection = { zones: new Set(), plants: new Set() };  // ids de zones, uid d'étiquettes
let rectSel = null;                                       // rectangle en cours de tracé
 
/* ---------------------------------------------
   Dimensions d'une étiquette, en unités du plan
   --------------------------------------------- */
function dimensionsEtiquette(r) {
  const nom  = (r.Nom || '').substring(0, NB_CAR_MAX);
  const var_ = (r.Variete || '').substring(0, NB_CAR_MAX);
  const w = Math.max(nom.length, var_.length) * 5.2 + 10;
  const h = var_ ? 26 : 16;
  return { nom, var_, w, h };
}
 
function tailleEtiquette(p) {
  const r = recordsParId.get(p.pid);
  const d = r ? dimensionsEtiquette(r) : { w: 60, h: 26 };
  const k = tailleEtiquettes / FACTEUR_PLAN;
  return { w: d.w * k, h: d.h * k };
}
 
// Empêche une étiquette de sortir de la surface de travail
function limiterAuPlan(p) {
  const t = tailleEtiquette(p);
  p.x = Math.min(Math.max(p.x, 0), Math.max(0, PLAN_W - t.w));
  p.y = Math.min(Math.max(p.y, 0), Math.max(0, PLAN_H - t.h));
}
 
/* ---------------------------------------------
   Boîtes englobantes (zone tournée comprise)
   --------------------------------------------- */
function boiteZone(zid) {
  const z = ZONES_DEF.find(x => x.id === zid);
  const st = getZoneState(z);
  const cx = st.x + st.w / 2;
  const cy = st.y + st.h / 2;
  const a = (st.rot || 0) * Math.PI / 180;
 
  const coins = [[0, 0], [st.w, 0], [st.w, st.h], [0, st.h]].map(([px, py]) => {
    const dx = px - st.w / 2;
    const dy = py - st.h / 2;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a),
            cy + dx * Math.sin(a) + dy * Math.cos(a)];
  });
 
  return {
    x0: Math.min(...coins.map(c => c[0])),
    x1: Math.max(...coins.map(c => c[0])),
    y0: Math.min(...coins.map(c => c[1])),
    y1: Math.max(...coins.map(c => c[1]))
  };
}
 
function boiteSelection() {
  const boites = [];
  selection.zones.forEach(zid => boites.push(boiteZone(zid)));
  selection.plants.forEach(uid => {
    const p = placements.find(x => x.uid === uid);
    if (p) {
      const t = tailleEtiquette(p);
      boites.push({ x0: p.x, y0: p.y, x1: p.x + t.w, y1: p.y + t.h });
    }
  });
  if (!boites.length) return null;
  return {
    x0: Math.min(...boites.map(b => b.x0)),
    y0: Math.min(...boites.map(b => b.y0)),
    x1: Math.max(...boites.map(b => b.x1)),
    y1: Math.max(...boites.map(b => b.y1))
  };
}
 
/* ---------------------------------------------
   Dessin du rectangle de sélection / de la boîte du groupe
   --------------------------------------------- */
function renderSelection() {
  const layer = document.getElementById('selection-layer');
  if (!layer) return;
  let html = '';
 
  if (rectSel) {
    const x = Math.min(rectSel.x0, rectSel.x1);
    const y = Math.min(rectSel.y0, rectSel.y1);
    const w = Math.abs(rectSel.x1 - rectSel.x0);
    const h = Math.abs(rectSel.y1 - rectSel.y0);
    html = `<rect class="rect-selection" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  } else {
    const b = boiteSelection();
    if (b) {
      html = `<rect class="boite-selection" x="${b.x0 - 4}" y="${b.y0 - 4}"
                    width="${b.x1 - b.x0 + 8}" height="${b.y1 - b.y0 + 8}"/>`;
    }
  }
  layer.innerHTML = html;
}
 
/* ---------------------------------------------
   Tracé du rectangle (clic sur le fond en mode Sélection)
   --------------------------------------------- */
function demarrerRectangle(e) {
  e.preventDefault();
  const pt = svgPoint(e, svg);
  rectSel = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y };
  drag = { type: 'rectangle', startX: pt.x, startY: pt.y };
}
 
// Sont sélectionnés les éléments ENTIÈREMENT dans le rectangle
function terminerRectangle() {
  const r = {
    x0: Math.min(rectSel.x0, rectSel.x1), x1: Math.max(rectSel.x0, rectSel.x1),
    y0: Math.min(rectSel.y0, rectSel.y1), y1: Math.max(rectSel.y0, rectSel.y1)
  };
  rectSel = null;
 
  selection.zones.clear();
  selection.plants.clear();
 
  // Un simple clic (rectangle minuscule) vide la sélection
  if (r.x1 - r.x0 > 3 || r.y1 - r.y0 > 3) {
    ZONES_DEF.forEach(z => {
      const b = boiteZone(z.id);
      if (b.x0 >= r.x0 && b.x1 <= r.x1 && b.y0 >= r.y0 && b.y1 <= r.y1) {
        selection.zones.add(z.id);
      }
    });
    placements.forEach(p => {
      const t = tailleEtiquette(p);
      if (p.x >= r.x0 && p.x + t.w <= r.x1 && p.y >= r.y0 && p.y + t.h <= r.y1) {
        selection.plants.add(p.uid);
      }
    });
  }
  renderAll();
}
 
/* ---------------------------------------------
   Déplacement de la sélection
   (un élément non sélectionné est d'abord sélectionné seul)
   --------------------------------------------- */
function demarrerDeplacementSelection(e, type, id) {
  const dejaDedans = type === 'zone' ? selection.zones.has(id) : selection.plants.has(id);
  if (!dejaDedans) {
    selection.zones.clear();
    selection.plants.clear();
    (type === 'zone' ? selection.zones : selection.plants).add(id);
  }
 
  e.preventDefault();
  e.stopPropagation();
  const pt = svgPoint(e, svg);
 
  drag = {
    type: 'groupe',
    startX: pt.x,
    startY: pt.y,
    boite: boiteSelection(),
    zones: [...selection.zones].map(zid => ({
      zid,
      st: { ...getZoneState(ZONES_DEF.find(z => z.id === zid)) }
    })),
    plants: [...selection.plants].map(uid => {
      const p = placements.find(x => x.uid === uid);
      return { uid, x: p ? p.x : 0, y: p ? p.y : 0 };
    })
  };
  renderAll();
}
 
function deplacerGroupe(dx, dy) {
  const b = drag.boite;
  // Tout le groupe reste dans la surface de travail
  dx = Math.min(Math.max(dx, -b.x0), PLAN_W - b.x1);
  dy = Math.min(Math.max(dy, -b.y0), PLAN_H - b.y1);

  drag.zones.forEach(z => {
    const s = { ...z.st, x: z.st.x + dx, y: z.st.y + dy };
    zonePos[z.zid] = s;
    const g = document.getElementById('zg-' + z.zid);
    if (g) g.setAttribute('transform',
      `translate(${s.x},${s.y}) rotate(${s.rot},${s.w / 2},${s.h / 2})`);
  });

  drag.plants.forEach(q => {
    const p = placements.find(x => x.uid === q.uid);
    if (!p) return;
    p.x = q.x + dx;
    p.y = q.y + dy;
    const g = document.querySelector(`#plants-layer [data-uid="${p.uid}"]`);
    if (g) g.setAttribute('transform', transformEtiquette(p));
  });

  if (drag.plants.length || drag.zones.length) modifie = true;

  renderNoms();        // les noms suivent les zones (appelle aussi majStatut)
  renderSelection();   // la boîte de sélection suit le groupe
}
 
function finDeplacement() {
  if (drag && drag.type === 'rectangle' && rectSel) terminerRectangle();
  drag = null;
}
 
/* ---------------------------------------------
   Écouteurs (sur la fenêtre : le glissement continue même
   quand la souris sort de la surface, plus de "lâcher" au bord)
   --------------------------------------------- */
// Clic sur le fond en mode Sélection : début du rectangle
svg.addEventListener('pointerdown', e => {
  if (mode !== 'select') return;
  if (e.target.closest('.zone-group, .placed-label')) return;  // géré par la zone / l'étiquette
  demarrerRectangle(e);
});
 
window.addEventListener('pointermove', e => {
  if (!drag || pincement) return;
  if (e.buttons === 0) { finDeplacement(); return; }   // bouton relâché hors de la fenêtre
 
  const pt = svgPoint(e, svg);
  const dx = pt.x - drag.startX;
  const dy = pt.y - drag.startY;
 
    if (drag.type === 'zone') {
    const z  = ZONES_DEF.find(x => x.id === drag.zid);
    const st = getZoneState(z);
    zonePos[drag.zid] = { ...st, x: drag.origX + dx, y: drag.origY + dy };

    // Garde la zone (tournée comprise) dans la surface de travail
    const b = boiteZone(drag.zid);
    let cx = 0, cy = 0;
    if (b.x0 < 0)      cx = -b.x0;
    if (b.x1 > PLAN_W) cx = PLAN_W - b.x1;
    if (b.y0 < 0)      cy = -b.y0;
    if (b.y1 > PLAN_H) cy = PLAN_H - b.y1;
    zonePos[drag.zid].x += cx;
    zonePos[drag.zid].y += cy;
    modifie = true;

    const nst = zonePos[drag.zid];
    const g = document.getElementById('zg-' + drag.zid);
    if (g) g.setAttribute('transform',
      `translate(${nst.x},${nst.y}) rotate(${nst.rot},${nst.w / 2},${nst.h / 2})`);
    renderNoms();

      } else if (drag.type === 'plant') {
    const p = placements.find(x => x.uid === drag.uid);
    if (p) {
      p.x = drag.origX + dx;
      p.y = drag.origY + dy;
      limiterAuPlan(p);
      modifie = true;
      const g = document.querySelector(`#plants-layer [data-uid="${p.uid}"]`);
      if (g) g.setAttribute('transform', transformEtiquette(p));
      majStatut();
    }

  } else if (drag.type === 'groupe') {
    deplacerGroupe(dx, dy);

  } else if (drag.type === 'rectangle') {
    rectSel.x1 = Math.min(Math.max(pt.x, 0), PLAN_W);
    rectSel.y1 = Math.min(Math.max(pt.y, 0), PLAN_H);
    renderSelection();
  }
});
 
window.addEventListener('pointerup', finDeplacement);
window.addEventListener('pointercancel', finDeplacement);
