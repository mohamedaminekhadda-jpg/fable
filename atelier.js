/* L'ATELIER — l'entrée du développeur, sur la page publique.
 *
 * ── Ce que ceci est, et ce que ceci n'est pas ──────────────────────────────
 *
 * Studio, Le Classeur et le cahier tournent sur VOTRE machine, en Node, liés à
 * 127.0.0.1. Ils ne sont pas sur le site et ne peuvent pas y être : Studio
 * écrit des fichiers et lance des constructions, et un hébergement statique ne
 * fait tourner aucun programme. Ce panneau ne « donne accès » à rien : il
 * ouvre des liens vers vos ports locaux.
 *
 * C'est pour cela qu'il est sûr. Un visiteur qui clique sur « Studio » ouvre
 * `http://localhost:4000` CHEZ LUI, où il n'y a rien — et si par hasard il y
 * avait quelque chose, ce ne serait pas le vôtre. Le lien ne fuit rien : que
 * Studio écoute sur 4000 en local n'est pas un secret, c'est une convention.
 * Ce qui protège Studio, c'est qu'il refuse tout `Host` qui n'est pas
 * localhost et toute origine étrangère — la même garde que le cahier.
 *
 * ── Le mot de passe, et pourquoi il ne promet rien de plus ─────────────────
 *
 * Une vérification de mot de passe faite en JavaScript sur un site public ne
 * protège rien : le code est dans le dépôt, on le lit et on le contourne. Un
 * mot de passe écrit dans ce fichier, ou même son empreinte, serait donc une
 * décoration — et une décoration dangereuse, parce qu'on lui fait confiance.
 *
 * Alors celui-ci ne ressemble à ça sur aucun point :
 *
 *   • rien n'est livré. Vous le choisissez à la première ouverture, sur votre
 *     machine. Le dépôt ne contient AUCUNE empreinte : il n'y a rien à trouver
 *     ni à casser hors ligne.
 *   • il est étiré par PBKDF2-SHA256, 210 000 tours, avec un sel tiré au
 *     hasard. Un `SHA-256(mot)` nu se retrouve dans une table toute faite.
 *   • il ne garde que le panneau fermé, sur CE navigateur. C'est utile — un
 *     portable prêté, quelqu'un derrière vous — et c'est tout ce qu'il dit.
 *
 * Si un jour vous voulez atteindre Studio depuis ailleurs avec une vraie
 * authentification, ce n'est pas ici que ça se joue : il faut un tunnel
 * (Cloudflare Tunnel + Access, gratuit jusqu'à cinquante personnes) qui met un
 * portail devant le serveur local. Le mot de passe est alors vérifié par
 * quelqu'un dont c'est le métier, avant que la requête n'arrive.
 */
(function () {
  'use strict';

  const CLE = 'fable-atelier';        // { sel, empreinte, tours }
  const OUVERT = 'fable-atelier-ouvert';
  const TOURS = 210000;

  /* Les outils locaux. Ce sont des ports par convention, pas des secrets. */
  const OUTILS = [
    { id: 'studio', nom: 'Studio', quoi: 'écrire et construire les manuels', port: 4000, reglable: true },
    { id: 'classeur', nom: 'Le Classeur', quoi: 'la plateforme (école, bulletins, examens)', port: 4300 },
    { id: 'cahier', nom: 'Le Jaguar', quoi: 'le cahier, version installée', port: 4242 },
    { id: 'sfy', nom: 'See for yourself', quoi: 'les simulations', port: 4500 },
  ];

  const lire = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* rien à faire */ } };

  /* `crypto.subtle` n'existe qu'en contexte sûr : HTTPS ou localhost. GitHub
     Pages est en HTTPS, donc tout va bien — mais un fichier ouvert en
     `file://` n'y aurait pas droit, et il faut le dire plutôt que de planter. */
  const chiffrable = !!(window.crypto && window.crypto.subtle && window.isSecureContext);

  const hexDe = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

  async function empreinte(mot, selHex, tours) {
    const enc = new TextEncoder();
    const sel = new Uint8Array(selHex.match(/../g).map((h) => parseInt(h, 16)));
    const base = await crypto.subtle.importKey('raw', enc.encode(mot), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: tours }, base, 256);
    return hexDe(bits);
  }

  /* Comparaison à temps constant. Le gain réel est mince ici — l'attaquant est
     déjà devant la machine — mais comparer deux empreintes avec `===` est le
     genre de raccourci qu'on finit par recopier là où il compte. */
  function egales(a, b) {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
  }

  /* Étirer le mot de passe prend une seconde et demie — c'est le but. Mais un
     bouton qui reste cliquable pendant ce temps lance deux dérivations en
     parallèle, et la plus lente écrase la conclusion de la plus rapide. On le
     désarme donc pendant le calcul, et on le rend, quoi qu'il arrive. */
  async function pendant(bouton, texte, dire, travail) {
    if (bouton.disabled) return undefined;
    const avant = bouton.textContent;
    bouton.disabled = true; bouton.textContent = texte;
    if (dire) dire('Un instant…');
    try { return await travail(); } finally { bouton.disabled = false; bouton.textContent = avant; }
  }

  /* ── le panneau ─────────────────────────────────────────────────────────── */
  let dlg = null;

  function bati() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'atelier';
    dlg.innerHTML = ''
      + '<style>'
      + '#atelier{border:1px solid var(--trait);border-radius:14px;background:var(--carte);'
      + 'color:var(--encre);padding:0;max-width:440px;width:calc(100% - 32px);box-shadow:var(--ombre);'
      + 'font:15px/1.55 ui-serif,Georgia,serif}'
      + '#atelier::backdrop{background:rgba(8,9,12,.62)}'
      + '#atelier .at-in{padding:22px 24px 20px}'
      + '#atelier h2{font:600 13px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;'
      + 'color:var(--or);margin:0 0 12px}'
      + '#atelier p{margin:0 0 14px;color:var(--doux);font-size:14px}'
      + '#atelier label{display:block;font-size:13px;color:var(--doux);margin:0 0 6px}'
      + '#atelier input{width:100%;font:15px ui-monospace,monospace;padding:9px 11px;'
      + 'border:1px solid var(--trait);border-radius:8px;background:var(--fond);color:var(--encre)}'
      + '#atelier input:focus{outline:2px solid var(--or);outline-offset:1px}'
      + '#atelier .at-btns{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}'
      + '#atelier button{font:14px ui-serif,Georgia,serif;cursor:pointer;padding:8px 15px;'
      + 'border-radius:8px;border:1px solid var(--trait);background:var(--fond);color:var(--encre)}'
      + '#atelier button.at-fort{background:var(--or);border-color:var(--or);color:#12100c;font-weight:600}'
      + '#atelier .at-err{color:#c0392b;font-size:13.5px;margin:10px 0 0;min-height:1.2em}'
      + '#atelier .at-liste{list-style:none;margin:0;padding:0}'
      + '#atelier .at-liste li{border-top:1px solid var(--trait)}'
      + '#atelier .at-liste a{display:flex;align-items:baseline;gap:10px;padding:12px 2px;'
      + 'text-decoration:none;color:inherit}'
      + '#atelier .at-liste a:hover{color:var(--or)}'
      + '#atelier .at-liste b{font-weight:600;font-size:15px}'
      + '#atelier .at-liste span{color:var(--doux);font-size:13px}'
      + '#atelier .at-liste code{margin-left:auto;font:12px ui-monospace,monospace;color:var(--or)}'
      + '#atelier .at-pied{margin-top:16px;padding-top:13px;border-top:1px solid var(--trait);'
      + 'font-size:12.5px;color:var(--doux)}'
      + '#atelier .at-pied button{font-size:12.5px;padding:4px 9px}'
      + '</style><div class="at-in"></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('close', () => { corps().innerHTML = ''; });
    return dlg;
  }
  const corps = () => dlg.querySelector('.at-in');

  function ouvrir() {
    bati();
    if (sessionStorage.getItem(OUVERT) === '1') peindreOutils();
    else if (!chiffrable) peindreOutils('Contexte non sécurisé : le mot de passe est indisponible ici.');
    else if (!lire(CLE)) peindreChoix();
    else peindreEntree();
    if (!dlg.open) dlg.showModal();
  }

  /* première fois : on choisit le mot de passe */
  function peindreChoix() {
    corps().innerHTML = '<h2>Atelier</h2>'
      + '<p>Choisissez un mot de passe. Il reste sur ce navigateur : rien n’est envoyé, '
      + 'et rien n’est écrit dans le site. Il garde ce panneau fermé, ici — il ne protège '
      + 'pas Studio, qui se protège tout seul en n’écoutant que cette machine.</p>'
      + '<label for="at-a">Mot de passe (8 caractères au moins)</label>'
      + '<input id="at-a" type="password" autocomplete="new-password" spellcheck="false">'
      + '<label for="at-b" style="margin-top:11px">Répétez-le</label>'
      + '<input id="at-b" type="password" autocomplete="new-password" spellcheck="false">'
      + '<p class="at-err" id="at-err"></p>'
      + '<div class="at-btns"><button class="at-fort" id="at-ok">Enregistrer</button>'
      + '<button id="at-non">Annuler</button></div>'
      + '<p class="at-pied">Il n’y a aucune récupération possible : personne ne le connaît, '
      + 'donc personne ne peut le renvoyer. Oublié, il faudra le réinitialiser et tout '
      + 'reperdre de ce panneau — ce qui ne coûte rien, il ne contient que des liens.</p>';
    const err = corps().querySelector('#at-err');
    corps().querySelector('#at-non').onclick = () => dlg.close();
    const bok = corps().querySelector('#at-ok');
    bok.onclick = () => {
      const a = corps().querySelector('#at-a').value, b = corps().querySelector('#at-b').value;
      if (a.length < 8) { err.textContent = 'Huit caractères au moins.'; return; }
      if (a !== b) { err.textContent = 'Les deux ne sont pas identiques.'; return; }
      pendant(bok, 'Un instant…', (m) => { err.textContent = m; }, async () => {
        const sel = hexDe(crypto.getRandomValues(new Uint8Array(16)));
        ecrire(CLE, { sel, tours: TOURS, empreinte: await empreinte(a, sel, TOURS) });
        sessionStorage.setItem(OUVERT, '1');
        peindreOutils();
      });
    };
    setTimeout(() => corps().querySelector('#at-a').focus(), 30);
  }

  /* les fois suivantes : on le redemande */
  function peindreEntree() {
    corps().innerHTML = '<h2>Atelier</h2>'
      + '<label for="at-a">Mot de passe</label>'
      + '<input id="at-a" type="password" autocomplete="current-password" spellcheck="false">'
      + '<p class="at-err" id="at-err"></p>'
      + '<div class="at-btns"><button class="at-fort" id="at-ok">Entrer</button>'
      + '<button id="at-non">Fermer</button></div>'
      + '<p class="at-pied">Oublié ? <button id="at-raz">Réinitialiser</button> '
      + 'efface le mot de passe de ce navigateur.</p>';
    const err = corps().querySelector('#at-err');
    const champ = corps().querySelector('#at-a');
    corps().querySelector('#at-non').onclick = () => dlg.close();
    corps().querySelector('#at-raz').onclick = () => {
      if (!confirm('Effacer le mot de passe de l’Atelier sur ce navigateur ?')) return;
      try { localStorage.removeItem(CLE); } catch { /* rien à faire */ }
      peindreChoix();
    };
    const bok = corps().querySelector('#at-ok');
    const essayer = () => {
      const g = lire(CLE);
      if (!g) return peindreChoix();
      return pendant(bok, 'Un instant…', (m) => { err.textContent = m; }, async () => {
        const e = await empreinte(champ.value, g.sel, g.tours || TOURS);
        if (!egales(e, g.empreinte)) { err.textContent = 'Ce n’est pas le bon.'; champ.select(); return; }
        sessionStorage.setItem(OUVERT, '1');
        peindreOutils();
      });
    };
    bok.onclick = essayer;
    champ.onkeydown = (e) => { if (e.key === 'Enter') essayer(); };
    setTimeout(() => champ.focus(), 30);
  }

  /* ── les adresses ──────────────────────────────────────────────────────────
   * Un outil est joignable soit sur cette machine (un port), soit à travers un
   * tunnel (une adresse complète, du genre `https://studio.exemple.ts.net`).
   * On garde donc une ADRESSE par outil, pas un port : c'est ce qui permet
   * d'ouvrir Studio depuis le téléphone sans changer quoi que ce soit au site.
   * Chacun choisit la sienne, dans son navigateur — rien n'est publié.
   */
  const ADRESSES = 'fable-atelier-adresses';

  function adresseDe(o, table) {
    const v = table[o.id];
    if (!v) return 'http://localhost:' + o.port + '/';
    if (/^\d+$/.test(String(v))) return 'http://localhost:' + v + '/';
    return String(v).replace(/\/*$/, '/');
  }
  const courte = (u) => {
    try { const x = new URL(u); return /^(localhost|127\.0\.0\.1)$/i.test(x.hostname) ? ':' + (x.port || '80') : x.hostname; }
    catch { return u; }
  };
  /* Seuls `http:` et `https:` sont acceptés. Sans ce filtre, une adresse
     `javascript:…` collée dans le champ deviendrait un lien qui exécute du
     code au clic — sur sa propre machine, mais c'est une porte qu'on n'ouvre
     pas par distraction. */
  const adresseValide = (v) => {
    if (/^\d+$/.test(v)) { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 65536; }
    try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  };

  /* ouvert : les liens vers les outils */
  function peindreOutils(note) {
    const table = lire(ADRESSES) || {};
    const distant = OUTILS.some((o) => table[o.id] && !/^\d+$/.test(String(table[o.id])));
    corps().innerHTML = '<h2>Atelier</h2>'
      + (note ? '<p>' + note + '</p>' : '')
      + '<p>' + (distant
        ? 'Une adresse distante est réglée : elle passe par votre tunnel, qui '
          + 'authentifie avant d’arriver à la machine.'
        : 'Ces outils tournent sur cette machine. Les liens ne servent qu’ici : '
          + 'ailleurs, ils ouvrent un port vide.') + '</p>'
      + '<ul class="at-liste">'
      + OUTILS.map((o, i) => {
        const u = adresseDe(o, table);
        return '<li><a href="' + u.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener"'
          + ' data-i="' + i + '"><b>' + o.nom + '</b><span>' + o.quoi + '</span>'
          + '<code>' + courte(u) + '</code></a></li>';
      }).join('')
      + '</ul>'
      + '<div class="at-btns"><button id="at-adr">Changer une adresse…</button>'
      + '<button id="at-verrou">Verrouiller</button>'
      + '<button id="at-non">Fermer</button></div>'
      + '<p class="at-pied">Un port (<code>4000</code>) pour cette machine, ou une adresse '
      + 'complète (<code>https://studio.mon-tailnet.ts.net</code>) pour y arriver d’ailleurs. '
      + 'Studio glisse sur 4001, 4002… si 4000 est pris : son terminal affiche le port retenu.</p>';
    corps().querySelector('#at-non').onclick = () => dlg.close();
    corps().querySelector('#at-verrou').onclick = () => { sessionStorage.removeItem(OUVERT); peindreEntree(); };
    corps().querySelector('#at-adr').onclick = () => {
      const noms = OUTILS.map((o, i) => (i + 1) + ' = ' + o.nom).join(', ');
      const q = prompt('Quel outil ? (' + noms + ')', '1');
      if (q === null) return;
      const o = OUTILS[Number(q) - 1];
      if (!o) { alert('Numéro inconnu.'); return; }
      const v = (prompt('Adresse de ' + o.nom + ' — un port, ou une URL complète :',
        String(table[o.id] || o.port)) || '').trim();
      if (!v) return;
      if (!adresseValide(v)) { alert('Attendu : un port (4000) ou une URL http(s) complète.'); return; }
      table[o.id] = /^\d+$/.test(v) ? Number(v) : v;
      ecrire(ADRESSES, table);
      peindreOutils();
    };
  }

  /* ── l'appel ────────────────────────────────────────────────────────────── */
  const lien = document.getElementById('lien-atelier');
  if (lien) lien.addEventListener('click', (e) => { e.preventDefault(); ouvrir(); });
  // `#atelier` dans l'adresse ouvre le panneau : un marque-page suffit alors.
  if (location.hash === '#atelier' || location.hash === '#dev') ouvrir();
})();
