// L'Europe, pays par pays.
//
// Chaque pays porte sa position réelle (longitude, latitude), sa date d'entrée
// dans la construction européenne, ses dates d'euro et de Schengen, sa
// population et son PIB. Rien d'autre n'est stocké : les densités, les
// moyennes, les parts et les écarts se calculent.
//
// Population : estimations 2023, en millions d'habitants.
// PIB : nominal 2023, en milliards de dollars.
// Les deux chiffres sont ceux d'aujourd'hui, y compris quand le curseur montre
// 1957. C'est délibéré, et c'est dit dans la note : on veut voir ce que chaque
// élargissement a ajouté au bloc actuel, sans mélanger la question avec celle de
// la croissance de chacun depuis soixante ans.

export const PIB_MONDE = 105000;   // PIB mondial nominal 2023, milliards de $

// statut : 'membre' (a une date d'entrée), 'candidat', 'hors' (ni l'un ni l'autre)
export const PAYS = [
  // ── les six de 1957 ────────────────────────────────────────────────────
  { code: 'DE', nom: 'Allemagne', lon: 10.4, lat: 51.2, ue: 1957, euro: 1999, schengen: 1995, pop: 84.4, pib: 4457 },
  { code: 'FR', nom: 'France', lon: 2.5, lat: 46.8, ue: 1957, euro: 1999, schengen: 1995, pop: 68.2, pib: 3031 },
  { code: 'IT', nom: 'Italie', lon: 12.5, lat: 42.8, ue: 1957, euro: 1999, schengen: 1997, pop: 58.9, pib: 2255 },
  { code: 'NL', nom: 'Pays-Bas', lon: 5.5, lat: 52.3, ue: 1957, euro: 1999, schengen: 1995, pop: 17.9, pib: 1118 },
  { code: 'BE', nom: 'Belgique', lon: 4.5, lat: 50.6, ue: 1957, euro: 1999, schengen: 1995, pop: 11.7, pib: 632 },
  { code: 'LU', nom: 'Luxembourg', lon: 6.1, lat: 49.8, ue: 1957, euro: 1999, schengen: 1995, pop: 0.66, pib: 86 },
  // ── 1973 ───────────────────────────────────────────────────────────────
  { code: 'DK', nom: 'Danemark', lon: 10.0, lat: 56.0, ue: 1973, euro: null, schengen: 2001, pop: 5.9, pib: 405 },
  { code: 'IE', nom: 'Irlande', lon: -8.0, lat: 53.3, ue: 1973, euro: 1999, schengen: null, pop: 5.3, pib: 546 },
  { code: 'GB', nom: 'Royaume-Uni', lon: -2.0, lat: 53.5, ue: 1973, sortie: 2020, euro: null, schengen: null, pop: 67.6, pib: 3340 },
  // ── 1981, 1986 ─────────────────────────────────────────────────────────
  { code: 'GR', nom: 'Grèce', lon: 22.5, lat: 39.3, ue: 1981, euro: 2001, schengen: 2000, pop: 10.4, pib: 238 },
  { code: 'ES', nom: 'Espagne', lon: -3.7, lat: 40.3, ue: 1986, euro: 1999, schengen: 1995, pop: 48.4, pib: 1620 },
  { code: 'PT', nom: 'Portugal', lon: -8.2, lat: 39.6, ue: 1986, euro: 1999, schengen: 1995, pop: 10.6, pib: 287 },
  // ── 1995 ───────────────────────────────────────────────────────────────
  { code: 'AT', nom: 'Autriche', lon: 14.5, lat: 47.6, ue: 1995, euro: 1999, schengen: 1997, pop: 9.1, pib: 517 },
  { code: 'FI', nom: 'Finlande', lon: 26.0, lat: 63.0, ue: 1995, euro: 1999, schengen: 2001, pop: 5.6, pib: 296 },
  { code: 'SE', nom: 'Suède', lon: 15.5, lat: 60.5, ue: 1995, euro: null, schengen: 2001, pop: 10.5, pib: 593 },
  // ── 2004, le grand élargissement à l'est ───────────────────────────────
  { code: 'PL', nom: 'Pologne', lon: 19.5, lat: 52.0, ue: 2004, euro: null, schengen: 2007, pop: 36.7, pib: 811 },
  { code: 'CZ', nom: 'Tchéquie', lon: 15.5, lat: 49.8, ue: 2004, euro: null, schengen: 2007, pop: 10.9, pib: 331 },
  { code: 'HU', nom: 'Hongrie', lon: 19.5, lat: 47.2, ue: 2004, euro: null, schengen: 2007, pop: 9.6, pib: 212 },
  { code: 'SK', nom: 'Slovaquie', lon: 19.5, lat: 48.7, ue: 2004, euro: 2009, schengen: 2007, pop: 5.4, pib: 132 },
  { code: 'LT', nom: 'Lituanie', lon: 24.0, lat: 55.3, ue: 2004, euro: 2015, schengen: 2007, pop: 2.9, pib: 79 },
  { code: 'LV', nom: 'Lettonie', lon: 24.5, lat: 57.0, ue: 2004, euro: 2014, schengen: 2007, pop: 1.9, pib: 41 },
  { code: 'SI', nom: 'Slovénie', lon: 14.8, lat: 46.1, ue: 2004, euro: 2007, schengen: 2007, pop: 2.1, pib: 68 },
  { code: 'EE', nom: 'Estonie', lon: 25.5, lat: 58.8, ue: 2004, euro: 2011, schengen: 2007, pop: 1.4, pib: 41 },
  { code: 'CY', nom: 'Chypre', lon: 33.2, lat: 35.1, ue: 2004, euro: 2008, schengen: null, pop: 0.92, pib: 32 },
  { code: 'MT', nom: 'Malte', lon: 14.4, lat: 35.9, ue: 2004, euro: 2008, schengen: 2007, pop: 0.54, pib: 21 },
  // ── 2007, 2013 ─────────────────────────────────────────────────────────
  { code: 'RO', nom: 'Roumanie', lon: 25.0, lat: 45.9, ue: 2007, euro: null, schengen: 2025, pop: 19.0, pib: 351 },
  { code: 'BG', nom: 'Bulgarie', lon: 25.3, lat: 42.7, ue: 2007, euro: 2026, schengen: 2025, pop: 6.4, pib: 102 },
  { code: 'HR', nom: 'Croatie', lon: 16.4, lat: 45.1, ue: 2013, euro: 2023, schengen: 2023, pop: 3.9, pib: 82 },

  // ── candidats ──────────────────────────────────────────────────────────
  { code: 'TR', nom: 'Turquie', lon: 33.5, lat: 39.5, candidat: 1999, pop: 85.3, pib: 1108 },
  { code: 'MK', nom: 'Macédoine du Nord', lon: 21.7, lat: 41.6, candidat: 2005, pop: 1.8, pib: 15 },
  { code: 'ME', nom: 'Monténégro', lon: 19.3, lat: 42.7, candidat: 2010, pop: 0.62, pib: 7.4 },
  { code: 'RS', nom: 'Serbie', lon: 20.9, lat: 44.0, candidat: 2012, pop: 6.6, pib: 75 },
  { code: 'AL', nom: 'Albanie', lon: 20.0, lat: 41.0, candidat: 2014, pop: 2.8, pib: 23 },
  { code: 'UA', nom: 'Ukraine', lon: 31.0, lat: 49.0, candidat: 2022, pop: 37.0, pib: 179 },
  { code: 'MD', nom: 'Moldavie', lon: 28.5, lat: 47.0, candidat: 2022, pop: 2.5, pib: 16 },
  { code: 'BA', nom: 'Bosnie-Herzégovine', lon: 17.8, lat: 44.0, candidat: 2022, pop: 3.2, pib: 27 },

  // ── voisins qui n'en sont pas ──────────────────────────────────────────
  { code: 'NO', nom: 'Norvège', lon: 9.0, lat: 61.0, schengen: 2001, pop: 5.5, pib: 486,
    note: 'a dit non par référendum, deux fois : 1972 et 1994.' },
  { code: 'CH', nom: 'Suisse', lon: 8.2, lat: 46.8, schengen: 2008, pop: 8.8, pib: 885,
    note: 'a retiré sa candidature ; dans Schengen, hors de l’Union.' },
  { code: 'IS', nom: 'Islande', lon: -19.0, lat: 64.9, schengen: 2001, pop: 0.39, pib: 31,
    note: 'a demandé son adhésion en 2009, puis l’a suspendue en 2015.' },
  { code: 'MA', nom: 'Maroc', lon: -6.0, lat: 32.0, pop: 37.0, pib: 141,
    note: 'a demandé son adhésion en 1987 ; la demande a été refusée au motif '
      + 'que le Maroc n’est pas un État européen. Il est aujourd’hui lié à '
      + 'l’Union par un accord d’association et le statut avancé (2008).' },
  { code: 'DZ', nom: 'Algérie', lon: 3.0, lat: 32.5, pop: 45.6, pib: 240 },
  { code: 'TN', nom: 'Tunisie', lon: 9.5, lat: 34.5, pop: 12.5, pib: 49 },
];

// Les vagues, dans l'ordre. Le libellé est ce qu'on met sous une frise.
export const VAGUES = [
  { an: 1957, titre: 'Traité de Rome', qui: 'les Six', couleur: '#1b4965' },
  { an: 1973, titre: 'Europe du Nord', qui: 'Danemark, Irlande, Royaume-Uni', couleur: '#2c7da0' },
  { an: 1981, titre: 'Grèce', qui: 'Grèce', couleur: '#468faf' },
  { an: 1986, titre: 'Europe du Sud', qui: 'Espagne, Portugal', couleur: '#61a5c2' },
  { an: 1995, titre: 'pays neutres', qui: 'Autriche, Finlande, Suède', couleur: '#89c2d9' },
  { an: 2004, titre: 'ouverture à l’Est', qui: 'dix pays', couleur: '#c9a227' },
  { an: 2007, titre: 'Balkans orientaux', qui: 'Bulgarie, Roumanie', couleur: '#d98c2b' },
  { an: 2013, titre: 'Croatie', qui: 'Croatie', couleur: '#c1440e' },
  { an: 2020, titre: 'Brexit', qui: 'départ du Royaume-Uni', couleur: '#8a8f98', depart: true },
];

export const AN_MIN = 1957, AN_MAX = 2026;

export const couleurVague = (an) => (VAGUES.find((v) => v.an === an) || {}).couleur || '#8a8f98';

// Membre à une date donnée : entré, et pas encore sorti.
export const estMembre = (p, an) => p.ue != null && an >= p.ue && !(p.sortie && an >= p.sortie);

export const membres = (an) => PAYS.filter((p) => estMembre(p, an));

/* Le bilan du bloc à une date : tout est une somme ou un quotient, rien n'est
   écrit à la main — c'est ce qui garantit que les six chiffres du panneau ne
   peuvent pas se contredire. */
export function bilan(an) {
  const m = membres(an);
  const pop = m.reduce((s, p) => s + p.pop, 0);
  const pib = m.reduce((s, p) => s + p.pib, 0);
  const parTete = m.map((p) => ({ code: p.code, nom: p.nom, v: (p.pib * 1000) / p.pop }));
  parTete.sort((a, b) => b.v - a.v);
  return {
    an, membres: m, n: m.length, pop, pib,
    pibParTete: pop ? (pib * 1000) / pop : 0,          // en dollars par habitant
    partMonde: pib / PIB_MONDE,
    riche: parTete[0] || null,
    pauvre: parTete[parTete.length - 1] || null,
    ecart: parTete.length > 1 ? parTete[0].v / parTete[parTete.length - 1].v : 1,
    euro: m.filter((p) => p.euro && an >= p.euro).length,
    schengen: m.filter((p) => p.schengen && an >= p.schengen).length,
  };
}

/* Les pastilles posées à la main ont vécu — et avec elles les soixante lignes
   de projection et d'écartement qui les empêchaient de se recouvrir. Les
   contours viennent désormais de Natural Earth (`europe-fond.js`, produit par
   `scripts/carto.mjs`), et la projection est le travail du banc : `lab.carte`.

   Les longitudes et latitudes ci-dessus ne servent donc plus à placer un carré.
   Elles ancrent l'étiquette d'un pays au bon endroit de sa surface, et donnent
   un point cliquable aux plus petits — le Luxembourg, Malte, le Monténégro —
   dont le polygone ne fait que quelques pixels de côté. */

// Une rampe qui reste lisible sur fond clair comme sur fond sombre : aucune de
// ses cinq bornes n'est ni presque blanche ni presque noire.
const RAMPE = ['#3b2a5c', '#3b528b', '#1e8f8a', '#63bf5b', '#d8c02e'];
export function teinte(t) {
  const x = Math.max(0, Math.min(1, t)) * (RAMPE.length - 1);
  const i = Math.min(RAMPE.length - 2, Math.floor(x)), f = x - i;
  const lire = (s) => [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16));
  const a = lire(RAMPE[i]), b = lire(RAMPE[i + 1]);
  return '#' + a.map((c, k) => Math.round(c + (b[k] - c) * f).toString(16).padStart(2, '0')).join('');
}
