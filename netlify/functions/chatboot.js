// netlify/functions/chatboot.js
const QUESTIONNAIRE_URL = "https://files-coaching.com/questionnaire.html";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

const low = (s) => (s || "").toLowerCase();
const any = (t, arr) => arr.some(k => t.includes(k));
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

const K = {
  hello: ["bonjour","salut","coucou","hello","yo"],
  form:  ["questionnaire","formulaire","accès","acces","inscription"],
  bug:   ["bug","erreur","problème","probleme","marche pas","bloqué","bloquee","bloque","je n'arrive pas","je narrive pas"],
  price: ["prix","tarif","abonnement","payer","paiement","combien","€","euro"],
  train: ["séance","seance","exercice","exos","programme","entrain","workout","routine","planning","plan d'entraînement","plan d entrainement"],
  food:  ["nutrition","recette","repas","manger","alimentation","macro","calorie","calories","protéine","proteine","glucide","lipide"],
  gear:  ["matériel","materiel","équipement","equipement","haltère","barre","élastique","tapis","chaussure","chaussures"],
  recover:["récup","recup","sommeil","étirement","etirement","stretch","courbature","hydratation"],
  motivate:["motivation","démarrer","demarrer","commencer","reprise","reprendre","régularité","regularite","discipline"]
};

const R = {
  hello: [
    "Salut 👋 Prêt(e) à avancer ?",
    "Hey 💪 comment puis-je t’aider aujourd’hui ?",
    "Coucou 👋 Besoin d’infos ou d’un coup de main sur le site ?"
  ],
  toFormTrain: [
    `Pour des séances/exercices adaptés, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Le mieux pour un programme sur mesure : le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Je te redirige vers le questionnaire pour un plan personnalisé 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`
  ],
  toFormFood: [
    `Je ne fournis pas de plan/recettes exactes ici 😉 Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Pas de nutrition détaillée dans le chat. On le fait après questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Pour une alimentation au cordeau, passe d’abord par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`
  ],
  toFormPrice: [
    `Les tarifs dépendent de tes objectifs. Oriente-toi via le questionnaire 👉 <a href="${QUESTIONNAIRENAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `On personnalise aussi le budget. D’abord le questionnaire, et on te dit tout 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`
  ],
  siteHelp: [
    `Besoin d’aide sur le site ? Dis-moi ce qui bloque et je te guide ✋`,
    `Tu peux accéder au questionnaire ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Pour nous écrire : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`
  ],
  bug: [
    `Oups 😅 dis-moi où ça bloque et je t’accompagne. Essaie aussi d’actualiser (⌘⇧R).`,
    `Je t’aide ! Tu peux aussi aller directement au formulaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">questionnaire</a>.`
  ],
  gear: [
    "Côté matériel, fais simple : haltères réglables + élastiques couvrent 90% des besoins.",
    "Pas de matos ? On peut travailler au poids du corps. Pour un plan précis → questionnaire 😉"
  ],
  recover: [
    "Priorise le sommeil (7–9h) + hydratation + 5–10 min d’étirements légers post-séance.",
    "Récup simple : sommeil régulier, eau, marche légère. Pour un plan complet → questionnaire."
  ],
  motivate: [
    "Fixe un objectif clair + 3 créneaux fixes/semaine. Petit pas > grand discours 😉",
    "Commence court (20–30 min), répète. La régularité fait 80% du job 💪"
  ],
  fallback: [
    `Je peux t’aider à naviguer sur le site, ou te rediriger vers le questionnaire pour un suivi personnalisé 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`,
    `Tu veux des infos, de l’aide ou t’orienter ? Je suis là 🙂`
  ]
};

function detect(msg) {
  if (any(msg, K.hello))     return "hello";
  if (any(msg, K.form))      return "form";
  if (any(msg, K.bug))       return "bug";
  if (any(msg, K.price))     return "price";
  if (any(msg, K.train))     return "train";
  if (any(msg, K.food))      return "food";
  if (any(msg, K.gear))      return "gear";
  if (any(msg, K.recover))   return "recover";
  if (any(msg, K.motivate))  return "motivate";
  return "other";
}

function respond(msg) {
  const intent = detect(msg);
  switch (intent) {
    case "hello":
      return { reply: pick(R.hello), suggestions: ["Accéder au questionnaire","Aide navigation","Contacter l’équipe"] };
    case "form":
      return { reply: pick(R.siteHelp) };
    case "bug":
      return { reply: pick(R.bug), suggestions: ["Accéder au questionnaire","Contacter l’équipe"] };
    case "price":
      return { reply: pick(R.toFormPrice) }; // jamais de prix ici
    case "train":
      return { reply: pick(R.toFormTrain), suggestions: ["Objectif perte de poids","Objectif prise de masse"] }; // jamais de séance complète
    case "food":
      return { reply: pick(R.toFormFood), suggestions: ["Accéder au questionnaire","Contacter l’équipe"] }; // jamais de nutrition précise
    case "gear":
      return { reply: pick(R.gear) };
    case "recover":
      return { reply: pick(R.recover) };
    case "motivate":
      return { reply: pick(R.motivate) };
    default:
      return { reply: pick(R.fallback), suggestions: ["Accéder au questionnaire","Aide navigation"] };
  }
}

exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R.hello) }) };
    }
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();
    if (!message) return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi ce dont tu as besoin 🙂" }) };
    const out = respond(low(message));
    return { statusCode: 200, headers, body: JSON.stringify(out) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }
};
