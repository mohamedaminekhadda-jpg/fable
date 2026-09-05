// Les vignettes des cartes du catalogue.
//
// Une vignette n'est pas une illustration : c'est la figure de la simulation,
// réduite à ce qu'on en reconnaîtrait de loin. Un escalier entre une courbe et
// une diagonale, une onde, trois carrés autour d'un triangle. Rien de plus —
// deux ou trois traits, jamais de texte, jamais de remplissage bavard. Vingt-huit
// cartes côte à côte doivent former une planche calme, pas une vitrine.
//
// Tout est tracé en `currentColor`, donc dans la couleur de la matière, et rien
// n'est un fichier image : cela reste net à toutes les tailles, suit le thème
// clair comme le sombre, et ne pèse rien.
//
// Repère commun : une boîte de 120 sur 60.

const T = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor" stroke="none"';
const doux = (o) => `fill="currentColor" stroke="none" opacity="${o}"`;

export const VIGNETTES = {
  /* ── mathématiques ─────────────────────────────────────────────────────── */
  escalier: () => `
    <path d="M14 52 L106 8" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 4" opacity=".45" fill="none"/>
    <path d="M14 44 Q46 14 106 10" ${T}/>
    <path d="M26 52 L26 36 L44 36 L44 26 L58 26 L58 20 L68 20" ${T} stroke-width="1.8" opacity=".85"/>
    <circle cx="26" cy="52" r="3" ${F}/>`,

  tangente: () => `
    <path d="M12 46 Q34 6 58 30 T108 16" ${T}/>
    <path d="M42 40 L86 8" stroke="currentColor" stroke-width="1.6" opacity=".55" fill="none"/>
    <circle cx="64" cy="24" r="3.6" ${F}/>`,

  rectangles: () => `
    <path d="M12 50 Q44 46 66 28 T108 8" ${T}/>
    <g ${doux('.22')}>
      <rect x="16" y="47" width="18" height="7"/><rect x="36" y="40" width="18" height="14"/>
      <rect x="56" y="30" width="18" height="24"/><rect x="76" y="17" width="18" height="37"/>
    </g>
    <path d="M12 54 L108 54" stroke="currentColor" stroke-width="1.4" opacity=".5" fill="none"/>`,

  cloche: () => `<g ${doux('.55')}>
      <rect x="20" y="46" width="9" height="8"/><rect x="33" y="36" width="9" height="18"/>
      <rect x="46" y="22" width="9" height="32"/><rect x="59" y="14" width="9" height="40"/>
      <rect x="72" y="26" width="9" height="28"/><rect x="85" y="41" width="9" height="13"/>
    </g>
    <path d="M14 54 L106 54" ${T} stroke-width="1.6"/>`,

  'plan-complexe': () => `
    <path d="M18 30 L102 30 M60 6 L60 54" stroke="currentColor" stroke-width="1.4" opacity=".45" fill="none"/>
    <circle cx="60" cy="30" r="20" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 3" fill="none" opacity=".5"/>
    <path d="M60 30 L88 14" ${T}/>
    <path d="M74 30 A14 14 0 0 0 68 20" stroke="currentColor" stroke-width="1.5" fill="none" opacity=".8"/>
    <circle cx="88" cy="14" r="3.6" ${F}/>`,

  /* Les carrés doivent être de VRAIS carrés — c'est le sujet même du théorème.
     Ma première version en dessinait deux aplatis, larges de trente-six et hauts
     de douze : sur une vignette qui promet « les trois carrés », c'était la seule
     erreur qu'il ne fallait pas faire. Les côtés valent donc tous vingt-six, et
     le carré de l'hypoténuse sort du cadre — on le laisse deviner plutôt que de
     mentir sur les deux autres. */
  pythagore: () => `
    <path d="M50 30 L50 4 L76 30 Z" ${T}/>
    <path d="M24 4 L50 4 L50 30 L24 30 Z" ${T} stroke-width="1.7"/>
    <path d="M50 30 L76 30 L76 56 L50 56 Z" ${T} stroke-width="1.7"/>
    <path d="M24 4 L50 4 L50 30 L24 30 Z" ${doux('.16')}/>
    <path d="M50 30 L76 30 L76 56 L50 56 Z" ${doux('.16')}/>
    <path d="M50 23 L57 23 L57 30" stroke="currentColor" stroke-width="1.5" fill="none" opacity=".9"/>`,

  balance: () => `
    <path d="M22 16 L98 16" ${T}/>
    <path d="M60 16 L60 44 M46 54 L74 54 L60 44 Z" ${T}/>
    <path d="M22 16 L22 30 M98 16 L98 30" stroke="currentColor" stroke-width="1.4" fill="none" opacity=".7"/>
    <path d="M8 30 L36 30 L31 44 L13 44 Z" ${doux('.22')}/>
    <path d="M84 30 L112 30 L107 44 L89 44 Z" ${doux('.22')}/>`,

  fractions: () => `
    <g ${T} stroke-width="1.8">
      <rect x="18" y="14" width="84" height="14" rx="2"/>
      <rect x="18" y="34" width="84" height="14" rx="2"/>
      <path d="M46 14 L46 28 M74 14 L74 28 M39 34 L39 48 M60 34 L60 48 M81 34 L81 48"/>
    </g>
    <g ${doux('.3')}><rect x="19" y="15" width="54" height="12"/><rect x="19" y="35" width="41" height="12"/></g>`,

  /* ── physique ──────────────────────────────────────────────────────────── */
  /* Le sommet d'une quadratique n'est PAS son point de contrôle : il se trouve à
     mi-chemin entre lui et la corde. Mes premières ondes visaient y = 6 et ne
     montaient qu'à 18 — elles n'occupaient que le tiers du cadre. Pour un sommet
     à s depuis une ligne à c, il faut placer le contrôle à 2s − c. */
  onde: () => `<path d="M8 30 Q20 -14 32 30 T56 30 T80 30 T104 30" ${T}/>
    <circle cx="68" cy="30" r="3.4" ${F}/>`,

  'onde-deux': () => `
    <path d="M8 20 Q20 -8 32 20 T56 20 T80 20 T104 20" ${T}/>
    <path d="M8 42 Q24 14 36 42 T60 42 T84 42 T108 42" ${T} opacity=".55"/>`,

  'onde-refraction': () => `
    <path d="M60 4 L60 56" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3" opacity=".55" fill="none"/>
    <path d="M8 30 Q20 -12 32 30 T56 30" ${T}/>
    <path d="M60 30 Q66 6 72 30 T84 30 T96 30 T108 30" ${T}/>`,

  diffraction: () => `
    <path d="M30 6 L30 24 M30 36 L30 54" ${T} stroke-width="3"/>
    <path d="M10 30 L28 30" ${T} stroke-width="1.6" opacity=".7"/>
    <g ${doux('.5')}>
      <rect x="94" y="24" width="8" height="12" rx="3"/>
      <rect x="94" y="8" width="8" height="6" rx="3" opacity=".55"/>
      <rect x="94" y="46" width="8" height="6" rx="3" opacity=".55"/>
    </g>
    <path d="M32 30 L92 30 M32 30 L92 11 M32 30 L92 49" stroke="currentColor" stroke-width="1.2" opacity=".45" fill="none"/>`,

  /* Le chemin de la lumière : un faisceau, deux renvois, une bille. La figure
     du jeu réduite à ce qu'on en reconnaît de loin. */
  lumiere: () => `
    <path d="M14 18 L64 18 L64 44 L100 44" ${T} stroke-width="1.7"/>
    <path d="M57 11 L71 25" ${T} stroke-width="2.4"/>
    <path d="M57 51 L71 37" ${T} stroke-width="2.4"/>
    <circle cx="14" cy="18" r="2.6" ${F}/>
    <circle cx="104" cy="44" r="5" ${T} stroke-width="1.6"/>
    <circle cx="104" cy="44" r="1.8" ${F}/>`,

  prisme: () => `
    <path d="M56 12 L78 46 L34 46 Z" ${T}/>
    <path d="M8 30 L44 30" ${T} stroke-width="1.8"/>
    <g stroke-width="1.6" fill="none" stroke="currentColor">
      <path d="M66 34 L110 22" opacity=".9"/><path d="M66 36 L110 30" opacity=".65"/>
      <path d="M67 38 L110 38" opacity=".45"/>
    </g>`,

  vallee: () => `
    <path d="M12 12 Q22 44 44 46 T78 42 Q96 38 108 20" ${T}/>
    <circle cx="52" cy="46" r="3.6" ${F}/>
    <path d="M12 54 L108 54" stroke="currentColor" stroke-width="1.4" opacity=".45" fill="none"/>`,

  niveaux: () => `
    <path d="M16 12 L54 12 M66 50 L104 50" ${T} stroke-width="2.6"/>
    <path d="M60 15 L60 47" ${T} stroke-width="1.8"/>
    <path d="M55 40 L60 48 L65 40" ${T} stroke-width="1.8"/>`,

  fission: () => `
    <circle cx="34" cy="30" r="14" ${T}/>
    <circle cx="84" cy="16" r="9" ${T} opacity=".8"/>
    <circle cx="86" cy="44" r="7" ${T} opacity=".8"/>
    <path d="M50 26 L70 18 M50 36 L72 43" stroke="currentColor" stroke-width="1.4" opacity=".55" fill="none"/>`,

  centrale: () => `
    <path d="M36 52 L42 24 Q50 20 58 24 L64 52 Z" ${T}/>
    <path d="M46 16 Q50 8 56 12" stroke="currentColor" stroke-width="1.5" opacity=".55" fill="none"/>
    <path d="M74 52 L74 34 L96 34 L96 52 Z" ${T} opacity=".7"/>
    <path d="M22 52 L104 52" ${T} stroke-width="1.6"/>`,

  // le saut d'un titrage, et le trait vertical qui marque l'équivalence
  titrage: () => `
    <path d="M60 8 L60 52" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 4" opacity=".45" fill="none"/>
    <path d="M12 48 L38 44 C52 41 56 37 60 29 C64 20 68 16 82 14 L108 11" ${T}/>
    <circle cx="60" cy="29" r="3.4" ${F}/>`,

  // deux rangées d'atomes face à face : une équation équilibrée est symétrique
  'balance-atomes': () => `
    <path d="M60 10 L60 50" stroke="currentColor" stroke-width="1.4" opacity=".4" fill="none"/>
    <g ${F}>
      <circle cx="50" cy="21" r="3.6"/><circle cx="40" cy="21" r="3.6"/><circle cx="30" cy="21" r="3.6"/>
      <circle cx="70" cy="21" r="3.6"/><circle cx="80" cy="21" r="3.6"/><circle cx="90" cy="21" r="3.6"/>
    </g>
    <g ${doux('.55')}>
      <circle cx="50" cy="39" r="3.6"/><circle cx="40" cy="39" r="3.6"/>
      <circle cx="70" cy="39" r="3.6"/><circle cx="80" cy="39" r="3.6"/>
    </g>`,

  // la courbe de chauffage : deux paliers, un long et un court
  palier: () => `
    <path d="M12 50 L30 42 L54 42 L66 26 L96 26 L108 16" ${T}/>
    <path d="M30 42 L54 42" ${T} stroke-width="4" opacity=".3"/>
    <path d="M66 26 L96 26" ${T} stroke-width="4" opacity=".3"/>`,

  /* ── SVT ───────────────────────────────────────────────────────────────── */
  arbre: () => `
    <g ${T}><rect x="22" y="6" width="15" height="15"/><circle cx="90" cy="14" r="7.5"/>
      <path d="M37 14 L82 14 M60 14 L60 32 M32 32 L88 32 M32 32 L32 40 M88 32 L88 40"/>
      <rect x="24" y="40" width="15" height="15"/><circle cx="88" cy="48" r="7.5"/></g>
    <rect x="24" y="40" width="15" height="15" ${doux('.5')}/>`,

  caryotype: () => `<g ${T} stroke-width="2.4" opacity=".9">
      <path d="M18 8 L26 30 L18 52 M34 8 L26 30 L34 52"/>
      <path d="M52 13 L59 31 L52 51 M66 13 L59 31 L66 51"/>
      <path d="M86 18 L92 33 L86 50 M98 18 L92 33 L98 50"/>
    </g>`,

  division: () => `
    <circle cx="30" cy="30" r="15" ${T}/>
    <path d="M26 24 L26 36 M34 24 L34 36" ${T} stroke-width="1.6" opacity=".7"/>
    <path d="M52 30 L68 30 M62 25 L68 30 L62 35" ${T} stroke-width="1.6" opacity=".6"/>
    <circle cx="88" cy="18" r="10" ${T}/><circle cx="88" cy="44" r="10" ${T}/>
    <path d="M84 14 L84 22 M92 14 L92 22 M88 40 L88 48" ${T} stroke-width="1.5" opacity=".7"/>`,

  // deux brins en sinusoïdes décalées d'un demi-tour, quelques barreaux : c'est
  // la plus petite chose qui se lise encore comme une double hélice
  helice: () => `
    <path d="M14 30 Q32 -6 50 30 T86 30 T110 12" ${T}/>
    <path d="M14 30 Q32 66 50 30 T86 30 T110 48" ${T} opacity=".7"/>
    <g stroke="currentColor" stroke-width="1.6" opacity=".5">
      <path d="M23 15 L23 45 M41 15 L41 45 M59 15 L59 45 M77 15 L77 45 M95 15 L95 45"/>
    </g>`,

  gel: () => `
    <rect x="26" y="8" width="68" height="46" rx="3" ${T} stroke-width="1.6" opacity=".6"/>
    <g ${doux('.75')}>
      <rect x="32" y="18" width="16" height="4" rx="2"/><rect x="32" y="38" width="16" height="4" rx="2"/>
      <rect x="52" y="18" width="16" height="4" rx="2"/>
      <rect x="72" y="28" width="16" height="4" rx="2"/><rect x="72" y="38" width="16" height="4" rx="2"/>
    </g>`,

  frise: () => `
    <path d="M10 34 L110 34" ${T}/>
    <g ${T} stroke-width="1.6"><path d="M30 26 L30 42 M58 26 L58 42 M86 26 L86 42"/></g>
    <circle cx="30" cy="12" r="4" ${F}/><circle cx="58" cy="12" r="4" ${F} opacity=".7"/>
    <circle cx="86" cy="12" r="4" ${F} opacity=".45"/>
    <g ${doux('.4')}><rect x="26" y="48" width="8" height="8" rx="2"/>
      <rect x="54" y="48" width="8" height="8" rx="2"/><rect x="82" y="48" width="8" height="8" rx="2"/></g>`,

  // trois papillons, du plus clair au plus sombre : c'est la population qui change
  papillon: () => {
    const p = (x, o) => `<path d="M${x} 30 q-11 -9 -13 1 q1.5 8 13 -1 q11 -9 13 1 q-1.5 8 -13 -1z"
      fill="currentColor" stroke="none" opacity="${o}"/>`;
    return p(28, '.28') + p(60, '.6') + p(92, '.95');
  },

  /* ── géographie ────────────────────────────────────────────────────────── */
  globe: () => `
    <circle cx="60" cy="30" r="22" ${T}/>
    <path d="M38 30 L82 30" ${T} stroke-width="1.5" opacity=".7"/>
    <ellipse cx="60" cy="30" rx="10" ry="22" ${T} stroke-width="1.5" opacity=".7"/>`,

  'globe-flux': () => `
    <circle cx="60" cy="30" r="21" ${T} opacity=".55"/>
    <path d="M38 30 L82 30" stroke="currentColor" stroke-width="1.3" opacity=".4" fill="none"/>
    <path d="M22 40 Q60 4 98 24" ${T} stroke-width="2.2"/>
    <path d="M92 18 L98 24 L90 28" ${T} stroke-width="2"/>
    <circle cx="22" cy="40" r="3.6" ${F}/>`,

  maroc: () => `
    <path d="M71 7 L84 9 L87 15 L82 19 L74 24 L61 29 L61 38 L49 38 L49 46 L46 46 L46 53
      L32 54 L41 38 L51 30 L59 18 L67 12 Z" ${T} stroke-width="1.8"/>
    <path d="M71 7 L84 9 L87 15 L82 19 L74 24 L61 29 L61 38 L49 38 L49 46 L46 46 L46 53
      L32 54 L41 38 L51 30 L59 18 L67 12 Z" ${doux('.14')}/>`,

  'cercle-etoiles': () => `<g ${F}>
      <circle cx="60" cy="10" r="3"/><circle cx="74" cy="14" r="3"/><circle cx="84" cy="24" r="3"/>
      <circle cx="88" cy="38" r="3"/><circle cx="78" cy="48" r="3"/><circle cx="60" cy="52" r="3"/>
      <circle cx="42" cy="48" r="3"/><circle cx="32" cy="38" r="3"/><circle cx="36" cy="24" r="3"/>
      <circle cx="46" cy="14" r="3"/>
    </g>`,

  barres: () => `<g ${T} stroke-width="2.2" stroke-linecap="butt">
      <path d="M20 14 L96 14"/><path d="M20 26 L74 26" opacity=".8"/>
      <path d="M20 38 L52 38" opacity=".6"/><path d="M20 50 L34 50" opacity=".45"/>
    </g>`,

  transition: () => `
    <path d="M12 16 Q40 16 60 34 T108 46" ${T}/>
    <path d="M12 30 Q34 46 58 44 T108 48" ${T} opacity=".6"/>
    <path d="M12 16 Q40 16 60 34 T108 46 L108 48 Q84 46 58 44 T12 30 Z" ${doux('.16')}/>`,

  // l'axe incliné et le terminateur : tout ce qui fait une saison
  saisons: () => `
    <circle cx="60" cy="30" r="19" ${T}/>
    <path d="M60 11 A19 19 0 0 0 60 49 Z" ${doux('.18')}/>
    <path d="M52 12 L68 48" ${T} stroke-width="1.6" opacity=".8"/>
    <path d="M8 22 H34 M8 30 H34 M8 38 H34" ${T} stroke-width="1.4" opacity=".5"/>`,

  // une coupe : la plaque qui plonge, et ses séismes
  plaques: () => `
    <path d="M10 24 H58" ${T}/>
    <path d="M58 24 L104 50" ${T}/>
    <path d="M62 20 Q80 14 110 18" ${T} opacity=".75"/>
    <g ${F}><circle cx="68" cy="30" r="2.4"/><circle cx="80" cy="37" r="2.4"/><circle cx="92" cy="44" r="2.4"/></g>
    <path d="M74 20 l5 -8 l5 8z" ${F}/>`,
};

// Une matière sans motif nommé n'est pas une erreur bloquante : on retombe sur
// une marque neutre plutôt que sur un trou dans la planche.
export const PAR_DEFAUT = {
  maths: 'tangente', physique: 'onde', svt: 'division', geographie: 'globe',
};

export function vignette(sim) {
  const f = VIGNETTES[sim.vignette] || VIGNETTES[PAR_DEFAUT[sim.subject]] || VIGNETTES.globe;
  return `<svg class="sim-vig" viewBox="0 0 120 60" aria-hidden="true" focusable="false">${f()}</svg>`;
}
