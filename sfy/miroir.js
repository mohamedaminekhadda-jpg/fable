/* LA PREUVE — le miroir qu'on tourne.
 *
 * Il vivait sur la page d'accueil de Fable ; il est ici chez lui. La promesse
 * du banc est « ne me croyez pas sur parole », et cette figure la tient en une
 * seule image : on tourne le miroir, la normale suit, et le rayon réfléchi est
 * RECALCULÉ par r = i − 2(i·n)n. Rien n'est dessiné d'avance.
 *
 * Deux mesures et leur écart, pas un nombre imprimé deux fois : l'angle
 * d'entrée est lu sur le rayon incident, celui de sortie sur le vecteur
 * réfléchi, séparément. L'écart vaut 0,0° parce que la géométrie le veut — et
 * c'est là qu'un solveur faux se trahirait.
 *
 * L'identité du banc s'applique : l'encre pour le miroir, --sub (la teinte du
 * foyer) pour la normale et les arcs, et le vermillon --live pour les rayons,
 * puisqu'il ne dit qu'une chose : une mesure tourne en ce moment.
 */
import { T } from './langue.js?v=mue7a3c0';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function miroirHTML() {
  return `<section class="preuve" aria-labelledby="preuve-h">
    <div class="preuve-txt">
      <p class="preuve-eye">${esc(T('mirEye'))}</p>
      <h2 class="preuve-h" id="preuve-h">${esc(T('mirH'))}</h2>
      <p class="preuve-p">${esc(T('mirP'))}</p>
    </div>
    <figure class="preuve-fig">
      <svg class="optique" viewBox="0 0 460 250" role="img" aria-label="${esc(T('mirTitre'))}">
        <g data-m="regle"></g>
        <path data-m="normale" class="m-normale" d=""/>
        <path data-m="arcIn" class="m-arc" d=""/>
        <path data-m="arcOut" class="m-arc" d=""/>
        <text data-m="lIn" class="m-lbl" x="0" y="0">θ</text>
        <text data-m="lOut" class="m-lbl" x="0" y="0">θ</text>
        <path data-m="rIn" class="m-rayon" d=""/>
        <path data-m="rOut" class="m-rayon m-sortant" d=""/>
        <path data-m="bille" class="m-bille" d="" pathLength="100"/>
        <line data-m="dos" class="m-dos" x1="0" y1="0" x2="0" y2="0"/>
        <line data-m="miroir" class="m-miroir" x1="0" y1="0" x2="0" y2="0"/>
        <circle data-m="poignee" class="m-poignee" r="9" cx="0" cy="0" tabindex="0"
          role="slider" aria-label="${esc(T('mirPoignee'))}" aria-valuemin="-55" aria-valuemax="40" aria-valuenow="-14"/>
        <circle data-m="impact" class="m-impact" r="3.2" cx="0" cy="0"/>
        <circle data-m="pouls" class="m-pouls" r="9" cx="0" cy="0"/>
      </svg>
      <figcaption class="preuve-cap">
        <span>${esc(T('mirNote'))}</span>
        <span class="preuve-val">
          <span class="mesure"><b data-m="vIn">0.0°</b><i>${esc(T('mirIn'))}</i></span>
          <span class="mesure"><b data-m="vOut">0.0°</b><i>${esc(T('mirOut'))}</i></span>
          <span class="mesure ecart"><b data-m="vGap">0.0°</b><i>${esc(T('mirGap'))}</i></span>
        </span>
      </figcaption>
    </figure>
  </section>`;
}

/* Branche la figure posée par miroirHTML(). Appelée à chaque rendu de
   l'accueil : le HTML vient d'être remplacé, les anciens écouteurs sont partis
   avec lui. */
export function animerMiroir(racine) {
  const svg = racine.querySelector('.optique');
  if (!svg) return;
  const M = (k) => svg.querySelector(`[data-m="${k}"]`) || racine.querySelector(`[data-m="${k}"]`);
  const S = { x: 34, y: 44 };          // la source
  const P = { x: 258, y: 170 };        // le point d'impact, fixe : c'est le miroir qui tourne
  const DEMI = 96, MIN = -55, MAX = 40;
  let alpha = -14;

  let lignes = '';
  for (let x = 20; x < 460; x += 20) lignes += `<line class="m-regle" x1="${x}" y1="0" x2="${x}" y2="250"/>`;
  for (let y = 10; y < 250; y += 20) lignes += `<line class="m-regle" x1="0" y1="${y}" x2="460" y2="${y}"/>`;
  M('regle').innerHTML = lignes;

  const pose = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };

  function dessine() {
    const a = alpha * Math.PI / 180;
    const d = { x: Math.cos(a), y: Math.sin(a) };          // le long du miroir
    const n = { x: -Math.sin(a), y: Math.cos(a) };         // sa normale
    // la normale regarde du côté d'où vient la lumière, sinon l'arc se dessine de l'autre côté
    const i = { x: P.x - S.x, y: P.y - S.y };
    const li = Math.hypot(i.x, i.y); i.x /= li; i.y /= li;
    if (i.x * n.x + i.y * n.y > 0) { n.x = -n.x; n.y = -n.y; }
    const dot = i.x * n.x + i.y * n.y;
    const r = { x: i.x - 2 * dot * n.x, y: i.y - 2 * dot * n.y };

    const e1 = { x: P.x - DEMI * d.x, y: P.y - DEMI * d.y };
    const e2 = { x: P.x + DEMI * d.x, y: P.y + DEMI * d.y };
    pose(M('miroir'), { x1: e1.x, y1: e1.y, x2: e2.x, y2: e2.y });
    pose(M('dos'), { x1: e1.x - n.x * 5, y1: e1.y - n.y * 5, x2: e2.x - n.x * 5, y2: e2.y - n.y * 5 });
    const h = { x: P.x + (DEMI + 14) * d.x, y: P.y + (DEMI + 14) * d.y };
    pose(M('poignee'), { cx: h.x, cy: h.y, 'aria-valuenow': Math.round(alpha) });
    pose(M('pouls'), { cx: h.x, cy: h.y });
    pose(M('impact'), { cx: P.x, cy: P.y });

    const L = 420, fin = `${P.x + r.x * L} ${P.y + r.y * L}`;
    M('rIn').setAttribute('d', `M${S.x} ${S.y}L${P.x} ${P.y}`);
    M('rOut').setAttribute('d', `M${P.x} ${P.y}L${fin}`);
    M('bille').setAttribute('d', `M${S.x} ${S.y}L${P.x} ${P.y}L${fin}`);
    M('normale').setAttribute('d', `M${P.x} ${P.y}L${P.x + n.x * 74} ${P.y + n.y * 74}`);

    // les deux arcs, entre la normale et chaque rayon : égaux, on les montre
    const R = 34;
    const arc = (el, lbl, u, v) => {
      const a0 = Math.atan2(u.y, u.x), a1 = Math.atan2(v.y, v.x);
      let diff = a1 - a0;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const p0 = { x: P.x + R * Math.cos(a0), y: P.y + R * Math.sin(a0) };
      const p1 = { x: P.x + R * Math.cos(a1), y: P.y + R * Math.sin(a1) };
      el.setAttribute('d', `M${p0.x} ${p0.y}A${R} ${R} 0 0 ${diff > 0 ? 1 : 0} ${p1.x} ${p1.y}`);
      const am = a0 + diff / 2;
      pose(lbl, { x: P.x + (R + 13) * Math.cos(am) - 4, y: P.y + (R + 13) * Math.sin(am) + 4 });
    };
    arc(M('arcIn'), M('lIn'), { x: -i.x, y: -i.y }, n);
    arc(M('arcOut'), M('lOut'), n, r);

    // MESURÉ, PAS AFFIRMÉ : deux droites, deux mesures, et leur écart
    const degres = (u, v) => Math.acos(Math.max(-1, Math.min(1, Math.abs(u.x * v.x + u.y * v.y)))) * 180 / Math.PI;
    const aI = degres(i, n), aR = degres(r, n);
    M('vIn').textContent = aI.toFixed(1) + '°';
    M('vOut').textContent = aR.toFixed(1) + '°';
    M('vGap').textContent = Math.abs(aI - aR).toFixed(1) + '°';   // abs : jamais « -0.0° »
  }

  function versPointeur(ev) {
    const b = svg.getBoundingClientRect();
    const x = (ev.clientX - b.left) / b.width * 460, y = (ev.clientY - b.top) / b.height * 250;
    let a = Math.atan2(y - P.y, x - P.x) * 180 / Math.PI;
    if (a > 90) a -= 180; else if (a < -90) a += 180;
    alpha = Math.max(MIN, Math.min(MAX, a));
    dessine();
  }

  /* L'invitation : trois ondes hors de la poignée la première fois qu'on
     arrive sur la figure, et plus jamais une fois qu'on l'a prise en main. */
  const cadre = svg.closest('.preuve-fig');
  const assez = () => cadre.classList.remove('invite');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((vues) => {
      if (!vues[0].isIntersecting) return;
      io.disconnect();
      cadre.classList.add('invite');
    }, { threshold: 0.55 });
    io.observe(cadre);
  }

  let tient = false;
  svg.addEventListener('pointerdown', (ev) => { assez(); tient = true; svg.setPointerCapture(ev.pointerId); versPointeur(ev); ev.preventDefault(); });
  svg.addEventListener('pointermove', (ev) => { if (tient) versPointeur(ev); });
  svg.addEventListener('pointerup', () => { tient = false; });
  svg.addEventListener('pointercancel', () => { tient = false; });
  // au clavier aussi : la poignée est un curseur, elle répond aux flèches
  M('poignee').addEventListener('keydown', (ev) => {
    assez();
    const k = ev.key, pas = ev.shiftKey ? 5 : 1;
    if (k === 'ArrowLeft' || k === 'ArrowDown') alpha = Math.max(MIN, alpha - pas);
    else if (k === 'ArrowRight' || k === 'ArrowUp') alpha = Math.min(MAX, alpha + pas);
    else if (k === 'Home') alpha = MIN;
    else if (k === 'End') alpha = MAX;
    else return;
    ev.preventDefault(); dessine();
  });

  dessine();
}
