// Les icônes des pièces.
//
// Une icône n'est pas une décoration : c'est la pièce, réduite à ce qu'on en
// reconnaît à seize pixels. Chacune est la FIGURE de l'objet — le trait d'un
// miroir, l'arc d'un miroir courbe, le triangle d'un prisme, les deux volets
// d'un diaphragme et le vide entre eux — jamais une lettre ni un symbole
// emprunté ailleurs.
//
// Repère commun : une boîte de 24 sur 24, tracé en `currentColor`, aucun
// remplissage bavard. Elles suivent donc la couleur du bouton, en thème clair
// comme en thème sombre, et restent nettes à toutes les tailles.

const P = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor" stroke="none"';

export const ICONES = {
  /* ── ce qui émet ─────────────────────────────────────────────────────── */
  // un boîtier et un trait : c'est tout ce qu'un laser est
  laser: `<rect x="3" y="9" width="7.5" height="6" rx="1.2" ${P}/>
    <path d="M11.5 12h9.5" ${P}/><circle cx="19.5" cy="12" r="1.4" ${F}/>`,

  // une ampoule rayonne de partout, et l'icône doit le dire
  ampoule: `<circle cx="12" cy="10" r="4.6" ${P}/><path d="M10 17.2h4M10.8 19.6h2.4" ${P}/>
    <path d="M12 2.2v1.8M4.6 10H2.8M21.2 10h-1.8M6.2 4.4L5 3.2M17.8 4.4L19 3.2" ${P} stroke-width="1.3" opacity=".75"/>`,

  // la flèche AB du cours
  objet: `<path d="M12 20.5V5" ${P}/><path d="M8.4 8.6L12 5l3.6 3.6" ${P}/>
    <path d="M6 20.5h12" ${P} stroke-width="1.2" opacity=".6"/>`,

  /* ── ce qui dévie ────────────────────────────────────────────────────── */
  // la face qui réfléchit, et le dos qui ne réfléchit pas
  miroir: `<path d="M5.5 18.5L18.5 5.5" ${P} stroke-width="2.3"/>
    <path d="M8 20.6L6.4 19M11.4 20.6L9.8 19M14.8 20.6L13.2 19" ${P} stroke-width="1.1" opacity=".7"/>`,

  // un arc, pas une droite : c'est toute la différence
  miroirc: `<path d="M8.5 3.6a11 11 0 0 1 0 16.8" ${P} stroke-width="2.3"/>
    <path d="M2.5 12h13" ${P} stroke-width="1.1" stroke-dasharray="2.4 2" opacity=".7"/>
    <circle cx="15.5" cy="12" r="1.3" ${F}/>`,

  prisme: `<path d="M12 4.4L19.4 18.6H4.6Z" ${P}/>
    <path d="M2.6 11.6h6" ${P} stroke-width="1.2" opacity=".7"/>`,

  // biconvexe : deux arcs qui se rejoignent
  lentille: `<path d="M12 3.6c4.2 4 4.2 12.8 0 16.8c-4.2-4-4.2-12.8 0-16.8z" ${P}/>
    <path d="M2.6 12h5M16.4 12h5" ${P} stroke-width="1.1" stroke-dasharray="2.4 2" opacity=".7"/>`,

  // deux volets, et le trou est ce qu'il y a entre eux
  diaphragme: `<path d="M12 2.8v6.4M12 14.8v6.4" ${P} stroke-width="2.3"/>
    <circle cx="12" cy="12" r="1.5" ${P} stroke-width="1.2" opacity=".8"/>`,

  filtre: `<rect x="6.2" y="6.2" width="11.6" height="11.6" rx="1.4" ${P}/>
    <path d="M2.6 12h3.6M17.8 12h3.6" ${P} stroke-width="1.2" opacity=".7"/>
    <path d="M8.4 15.6L15.6 8.4M11 17.4L17.4 11" ${P} stroke-width="1.1" opacity=".55"/>`,

  // à moitié transparente : le pointillé le dit
  separateur: `<path d="M5.5 18.5L18.5 5.5" ${P} stroke-width="2" stroke-dasharray="3 2.4"/>
    <path d="M2.6 12h4M12 2.6v4" ${P} stroke-width="1.1" opacity=".6"/>`,

  bloc: `<rect x="6" y="3.6" width="12" height="16.8" rx="1.8" ${P}/>
    <path d="M7.4 9.4c2 1.2 3.2-1.2 5.2 0s3.2-1.2 4-0.6" ${P} stroke-width="1.2" opacity=".85"/>
    <path d="M7.4 14c2 1.2 3.2-1.2 5.2 0s3.2-1.2 4-0.6" ${P} stroke-width="1.2" opacity=".6"/>`,

  mur: `<rect x="6" y="3.6" width="12" height="16.8" rx="1" ${P}/>
    <path d="M6 9.2h12M6 14.8h12" ${P} stroke-width="1.2" opacity=".7"/>
    <path d="M12 3.6v5.6M9 9.2v5.6M15 14.8v5.6" ${P} stroke-width="1.1" opacity=".5"/>`,

  /* ── ce qui reçoit ───────────────────────────────────────────────────── */
  ecran: `<path d="M17 3.6v16.8" ${P} stroke-width="2.3"/>
    <path d="M17 7.4h-3.4M17 12h-3.4M17 16.6h-3.4" ${P} stroke-width="1.1" opacity=".7"/>
    <path d="M2.6 12h7.4" ${P} stroke-width="1.2" opacity=".8"/>`,

  oeil: `<path d="M2.4 12s4-6.2 9.6-6.2S21.6 12 21.6 12s-4 6.2-9.6 6.2S2.4 12 2.4 12z" ${P}/>
    <circle cx="12" cy="12" r="2.6" ${P}/><circle cx="12" cy="12" r="1" ${F}/>`,

  cible: `<circle cx="12" cy="12" r="6.2" ${P}/><circle cx="12" cy="12" r="2" ${F}/>
    <path d="M2.6 12h3.2" ${P} stroke-width="1.2" opacity=".8"/>`,

  source: `<circle cx="7.6" cy="12" r="3.2" ${P}/><path d="M11.8 12h9.4" ${P}/>`,
};

/* Prête à coller dans un bouton. La taille est passée en pixels : le même
   dessin sert au panneau et, plus tard, à tout ce qui en aurait besoin. */
export function ico(type, taille = 16) {
  const d = ICONES[type];
  if (!d) return '';
  return '<svg viewBox="0 0 24 24" width="' + taille + '" height="' + taille
    + '" aria-hidden="true" style="flex:0 0 auto;display:block">' + d + '</svg>';
}
