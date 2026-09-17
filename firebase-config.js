/* LE COMPTE — la configuration Firebase, et rien d'autre.
 *
 * Tant que ce fichier n'est pas rempli, le cahier se comporte exactement comme
 * avant : tout reste sur l'appareil, aucun bouton de connexion n'apparaît, et
 * rien n'est demandé à personne. C'est voulu — une moitié de compte serait pire
 * que pas de compte du tout.
 *
 * ── CE QU'IL FAUT FAIRE, UNE FOIS ────────────────────────────────────────
 *
 * 1. console.firebase.google.com → « Ajouter un projet ». Firebase FAIT PARTIE
 *    de Google Cloud : le projet que vous créez là est un projet Google Cloud,
 *    visible dans console.cloud.google.com. C'est la réponse à « à quoi servirait
 *    Google Cloud » — à ceci.
 *
 * 2. Dans le projet : Authentication → Sign-in method → activez « Google » et,
 *    si vous le voulez, « E-mail/Mot de passe ».
 *
 * 3. Firestore Database → Créer une base → mode PRODUCTION (surtout pas « test »,
 *    qui laisse tout le monde lire tout). Puis Règles → collez le contenu de
 *    `firestore.rules`, à la racine du projet, et publiez.
 *
 * 4. Authentication → Settings → Authorized domains : ajoutez le domaine du
 *    site publié (mohamedaminekhadda-jpg.github.io) et localhost.
 *
 * 5. Paramètres du projet → Vos applications → Web → enregistrez l'application,
 *    et recopiez ci-dessous l'objet `firebaseConfig` qui s'affiche.
 *
 * ── « MAIS CETTE CLEF EST PUBLIQUE ? » ───────────────────────────────────
 *
 * Oui, et c'est normal. Une clef d'API web Firebase n'est pas un secret : elle
 * désigne le projet, elle n'ouvre rien. Ce qui protège les données, ce sont les
 * RÈGLES — et elles seules. Si les règles sont mauvaises, n'importe qui lit le
 * cahier de n'importe qui : c'est exactement la faille que l'audit de sécurité
 * avait trouvée sur les cahiers, et elle se reproduit ici à l'identique si l'on
 * publie la base en mode « test ». Lisez `firestore.rules` avant de la coller.
 *
 * ── CE QUE ÇA N'EST PAS ──────────────────────────────────────────────────
 *
 * Ce n'est pas une sauvegarde de l'école. Les cahiers restent d'abord sur
 * l'appareil ; le compte est une COPIE qui suit la personne d'un appareil à
 * l'autre. Et poser le travail d'un enfant sur un serveur n'est pas la même
 * chose que le laisser dans son navigateur : la connexion est facultative, elle
 * ne se déclenche jamais toute seule, et le cahier marche entier sans elle.
 */
export const CONFIG_FIREBASE = {
  apiKey: "AIzaSyBUstdrfj5ClEXdrDN-dGYWozns8qr8QRc",
  authDomain: "fable-562d4.firebaseapp.com",
  projectId: "fable-562d4",
  storageBucket: "fable-562d4.firebasestorage.app",
  messagingSenderId: "885484794658",
  appId: "1:885484794658:web:fff132e07b2a3703e46b7b",
};

/* ── QUI EST CHEZ SOI ICI ─────────────────────────────────────────────────
 *
 * Les adresses e-mail qui, une fois connectées, voient l'entrée de l'Atelier :
 * Studio, la Console, Le Classeur. Elles remplacent le mot de passe que ce
 * panneau demandait avant — un seul compte plutôt que deux secrets.
 *
 * QUE CE SOIT CLAIR : cette liste ne protège rien, et ne le prétend pas. Elle
 * est publique, comme tout ce qui part sur le site, et un panneau caché par du
 * JavaScript se rouvre en trois clics. Ce qui protège Studio et la Console,
 * c'est qu'ils n'écoutent que 127.0.0.1 et refusent tout autre `Host` : un
 * visiteur qui force ce panneau ouvre des liens vers SA machine, où il n'y a
 * rien. La liste ne fait qu'éviter de montrer une porte à ceux dont ce n'est
 * pas la maison.
 */
export const PROPRIETAIRES = [
  'mohamedaminekhadda@gmail.com',
];

/* La version du SDK chargée depuis le CDN de Google. Elle est écrite ici plutôt
   que dispersée dans le code : la monter, c'est changer un seul nombre. */
export const VERSION_SDK = '10.12.0';
