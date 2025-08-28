// netlify/functions/chatboot.js
// Files Chatbot — Bilingue FR/EN, SANS API d'IA, réponses variées + redirections strictes.
// Aucune dépendance, aucun secret requis. RESEND_API_KEY n'est PAS utilisé ici.

const QUESTIONNAIRE_URL = "questionnaire-files.questionnaire.app";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

// --------- utils ---------
const low  = (s) => (s || "").toLowerCase();
const any  = (t, arr) => arr.some(k => t.includes(k));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isEmpty = (v) => !v || !String(v).trim();

// Détection simple FR/EN : si mots anglais → EN, sinon FR
function detectLang(msg) {
  if (any(msg, ["hello","hi","hey","workout","training","plan","price","food","nutrition","help"]))
    return "en";
  return "fr";
}

// --------- lexiques intents ---------
const K = {
  fr: {
    hello: ["bonjour","salut","coucou","yo"],
    form:  ["questionnaire","formulaire","accès","acces","inscription"],
    bug:   ["bug","erreur","problème","probleme","marche pas","bloqué","bloquee","bloque","je n'arrive pas","je narrive pas"],
    price: ["prix","tarif","abonnement","payer","paiement","combien","€","euro","tarifs"],
    train: ["séance","seance","exercice","exos","programme","entrain","routine","planning","workout","plan d'entraînement","plan d entrainement"],
    food:  ["nutrition","recette","repas","manger","alimentation","macro","calorie","calories","protéine","proteine","glucide","lipide"],
    gear:  ["matériel","materiel","équipement","equipement","haltère","barre","élastique","tapis","chaussure","chaussures"],
    recover:["récup","recup","sommeil","étirement","etirement","stretch","courbature","hydratation","repos"],
    motivate:["motivation","démarrer","demarrer","commencer","reprise","reprendre","régularité","regularite","discipline","pas motivé","pas motive"]
  },
  en: {
    hello: ["hello","hi","hey"],
    form:  ["form","questionnaire","register","sign up","signup","sign-up","access"],
    bug:   ["bug","error","issue","problem","doesn't work","stuck","unable"],
    price: ["price","cost","plan","subscription","pay","euro","€","pricing"],
    train: ["session","exercise","workout","program","routine","training","plan","schedule"],
    food:  ["food","nutrition","diet","meal","recipe","protein","carb","fat","calorie","calories","macros"],
    gear:  ["equipment","gear","dumbbell","bar","elastic","band","mat","shoes"],
    recover:["recover","recovery","sleep","stretch","rest","hydration","sore","soreness"],
    motivate:["motivation","start","restart","discipline","regularity","consistency","not motivated"]
  }
};

// --------- banques de réponses variées ---------
const R = {
  fr: {
    hello: [
      "Salut 👋 Prêt(e) à avancer ?",
      "Hey 💪 comment puis-je t’aider aujourd’hui ?",
      "Coucou 👋 Besoin d’infos ou d’un coup de main sur le site ?"
    ],
    toFormTrain: [
      `Pour des séances/exercices adaptés, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Le mieux pour un programme sur mesure : le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Je te redirige vers le questionnaire pour un plan personnalisé 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`
    ],
    toFormFood: [
      `Je ne fournis pas de plan/recettes exactes ici 😉 Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Pas de nutrition détaillée dans le chat. On le fait après questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Pour une alimentation au cordeau, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`
    ],
    toFormPrice: [
      `Les tarifs dépendent de tes objectifs. Oriente-toi via le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `On personnalise aussi le budget. D’abord le questionnaire, et on te dit tout 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`
    ],
    siteHelp: [
      `Besoin d’aide sur le site ? Dis-moi ce qui bloque et je te guide ✋`,
      `Tu peux accéder au questionnaire ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Pour nous écrire : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`
    ],
    bug: [
      `Oups 😅 dis-moi où ça bloque et je t’accompagne. Essaie aussi d’actualiser (⌘⇧R).`,
      `Je t’aide ! Tu peux aussi aller directement au formulaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">questionnaire</a>.`
    ],
    gear: [
      "Un set d’haltères + élastiques couvre 90% des besoins 💪",
      "Sans matériel ? Le poids du corps fonctionne très bien."
    ],
    recover: [
      "Sommeil 7–9h, hydratation, étirements doux → base d’une bonne récup.",
      "Récup : dodo régulier, eau, marche légère."
    ],
    motivate: [
      "Petit pas régulier > grands discours 😉 Commence 20–30 min et tiens la cadence.",
      "Bloque 3 créneaux/semaine et tiens-les. La régularité fait 80% du job."
    ],
    fallback: [
      `Je peux t’aider à naviguer ou te rediriger vers le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Tu veux des infos, de l’aide ou t’orienter ? Je suis là 🙂`
    ],
    suggestions: {
      hello: ["Accéder au questionnaire","Aide navigation","Contacter l’équipe"],
      train: ["Objectif perte de poids","Objectif prise de masse"],
      bug:   ["Accéder au questionnaire","Contacter l’équipe"],
      generic:["Accéder au questionnaire","Aide navigation"]
    }
  },
  en: {
    hello: [
      "Hi 👋 Ready to move forward?",
      "Hey 💪 how can I help today?",
      "Hello 👋 Need info or guidance on the site?"
    ],
    toFormTrain: [
      `For tailored workouts, please fill the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `Custom program? Start here 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `I’ll redirect you to the form for a truly personalized plan 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
    ],
    toFormFood: [
      `I don’t provide exact meal plans here 😉 For a custom diet: <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `No detailed nutrition in chat. We do that after the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `For precise nutrition, please start with the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
    ],
    toFormPrice: [
      `Prices depend on your goals. Please go through the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `We personalize the budget too. Start with the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
    ],
    siteHelp: [
      `Need help on the site? Tell me what’s blocking and I’ll guide you ✋`,
      `You can access the form here: <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `You can also email us: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`
    ],
    bug: [
      `Oops 😅 tell me what’s broken and I’ll guide you. Try refreshing (Ctrl+Shift+R).`,
      `I can help! You can also jump straight to the form: <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">form</a>.`
    ],
    gear: [
      "A couple of dumbbells + resistance bands cover 90% of training.",
      "No equipment? Bodyweight training works great."
    ],
    recover: [
      "Sleep 7–9h, hydrate, light stretching → recovery basics.",
      "Recovery: regular sleep, water, easy walks."
    ],
    motivate: [
      "Small consistent steps > big speeches 😉 Start 20–30 min and keep steady.",
      "Book 3 weekly slots and stick to them. Consistency wins."
    ],
    fallback: [
      `I can help you navigate or redirect you to the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `Need info, help, or guidance? I’m here 🙂`
    ],
    suggestions: {
      hello: ["Access form","Site help","Contact team"],
      train: ["Weight loss goal","Muscle gain goal"],
      bug:   ["Access form","Contact team"],
      generic:["Access form","Site help"]
    }
  }
};

// --------- détection d'intentions ---------
function detectIntent(lang, msg) {
  const keys = K[lang];
  if (any(msg, keys.hello))    return "hello";
  if (any(msg, keys.form))     return "form";
  if (any(msg, keys.bug))      return "bug";
  if (any(msg, keys.price))    return "price";   // → redirection
  if (any(msg, keys.train))    return "train";   // → redirection
  if (any(msg, keys.food))     return "food";    // → redirection
  if (any(msg, keys.gear))     return "gear";
  if (any(msg, keys.recover))  return "recover";
  if (any(msg, keys.motivate)) return "motivate";
  return "other";
}

// --------- moteur de réponse ---------
function respond(lang, msg) {
  const set = R[lang];
  const intent = detectIntent(lang, msg);

  // Règles bloquantes
  if (intent === "price") return { reply: pick(set.toFormPrice) };
  if (intent === "train") return { reply: pick(set.toFormTrain), suggestions: set.suggestions.train };
  if (intent === "food")  return { reply: pick(set.toFormFood),  suggestions: set.suggestions.generic };

  // Raccourcis utiles
  if (intent === "hello")   return { reply: pick(set.hello),   suggestions: set.suggestions.hello };
  if (intent === "form")    return { reply: pick(set.siteHelp) };
  if (intent === "bug")     return { reply: pick(set.bug),     suggestions: set.suggestions.bug };
  if (intent === "gear")    return { reply: pick(set.gear) };
  if (intent === "recover") return { reply: pick(set.recover) };
  if (intent === "motivate")return { reply: pick(set.motivate) };

  // Fallback
  return { reply: pick(set.fallback), suggestions: set.suggestions.generic };
}

// --------- handler Netlify ---------
exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };

    // Test direct GET
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Chat prêt ✅ / Chat ready ✅" }) };
    }
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const message = String(body.message || "").trim();
    if (isEmpty(message)) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi quelque chose 🙂 / Say something 🙂" }) };
    }

    const lang = detectLang(message);
    const out  = respond(lang, low(message));

    return { statusCode: 200, headers, body: JSON.stringify(out) };
  } catch (e) {
    console.error("Function crash:", e);
    // on renvoie quand même une réponse (pas de 500 côté UI)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: `Je peux t’aider à naviguer / I can help you navigate 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès / Access</a>.`
      })
    };
  }
};
