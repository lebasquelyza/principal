// netlify/functions/chatboot.js
// Files Coaching — Chatbot IA (OpenAI), FR/EN, mots-clés + règles verrouillées.
//
// Règles:
// - Si on demande séance/exercices précis, nutrition/recettes exactes, ou prix → REDIRIGE vers questionnaire.
// - Sinon : appelle l'IA pour une réponse courte (1–3 phrases), utile, dans la bonne langue.
// - Post-filtre : si le modèle donne par erreur un contenu interdit → re-redirige.
//
// ENV requis: OPENAI_API_KEY (sk-...), OPENAI_MODEL (ex: gpt-4o-mini)
// Optionnel:  OPENAI_BASE_URL (par défaut https://api.openai.com/v1)

const QUESTIONNAIRE_URL = "https://files-coaching.com/questionnaire.html";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

// ---------------- Utils ----------------
const low = (s) => (s || "").toLowerCase();
const any = (t, arr) => arr.some(k => t.includes(k));
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const isEmpty = (v) => !v || !String(v).trim();

// Détection langue simple: mots anglais → en, sinon fr
function detectLang(msg) {
  if (any(msg, ["hello","hi","hey","workout","training","plan","price","food","nutrition","help","cost"]))
    return "en";
  return "fr";
}

// ---------------- Lexiques d’intentions ----------------
const K = {
  fr: {
    hello: ["bonjour","salut","coucou","yo"],
    form:  ["questionnaire","formulaire","accès","acces","inscription"],
    bug:   ["bug","erreur","problème","probleme","marche pas","bloqué","bloquee","bloque","je n'arrive pas","je narrive pas"],
    price: ["prix","tarif","tarifs","abonnement","payer","paiement","combien","€","euro"],
    train: ["séance","seance","exercice","exos","programme","entrain","routine","planning","workout","plan d'entraînement","plan d entrainement"],
    food:  ["nutrition","recette","recettes","repas","manger","alimentation","macro","calorie","calories","protéine","proteine","glucide","lipide"],
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

// ---------------- Réponses locales variées ----------------
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
      `I’ll redirect you to the form for a personalized plan 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
    ],
    toFormFood: [
      `I don’t provide exact meal plans here 😉 For a custom diet: <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `No detailed nutrition in chat. We’ll do that after the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
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

// Règles bloquantes → redirection
function policyAnswer(lang, msg) {
  const L = R[lang];
  const it = detectIntent(lang, msg);
  if (it === "price") return { reply: pick(L.toFormPrice) };
  if (it === "train") return { reply: pick(L.toFormTrain), suggestions: L.suggestions.train };
  if (it === "food")  return { reply: pick(L.toFormFood),  suggestions: L.suggestions.generic };
  return null;
}
// ---------------- Appel IA (OpenAI Chat Completions) ----------------
async function callLLM({ userMessage, lang }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model  = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base   = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const system = (lang === "en")
    ? "You are Files, a fitness assistant for files-coaching.com. Never provide full workouts, exact nutrition/recipes, or pricing. If asked for those, say to use the questionnaire link. Keep answers short (1–3 sentences), helpful, friendly."
    : "Tu es Files, assistant de coaching sportif pour files-coaching.com. Ne donne JAMAIS de séance complète, ni de nutrition/recettes exactes, ni de prix. Si on te les demande, dis d'utiliser le lien du questionnaire. Réponses courtes (1–3 phrases), utiles, amicales.";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      temperature: 0.6
    })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${t.slice(0,200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || (lang === "en"
    ? "I’m not sure I understood."
    : "Je ne suis pas sûr d’avoir compris.");
}

// ---------------- Handler ----------------
exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "IA prête ✅ / AI ready ✅" }) };
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
    const msgL = low(message);

    // 1) Règles bloquantes (redirigent immédiatement)
    const pol = policyAnswer(lang, msgL);
    if (pol) return { statusCode: 200, headers, body: JSON.stringify(pol) };

    // 2) Réponses rapides sans IA (salut, bug, matos, récup, motivation…)
    const quick = quickAnswer(lang, msgL);
    if (quick) return { statusCode: 200, headers, body: JSON.stringify(quick) };

    // 3) Sinon → IA
    let ai = await callLLM({ userMessage: message, lang });

    // 4) Post-filtre sécurité (si le modèle déborde)
    const bad = /(recette|recipes?|meal plan|nutrition plan|full (workout|program)|séance complète|prix|tarif|price|cost|exact macros?)/i;
    if (bad.test(ai)) {
      ai = (lang === "en")
        ? `For that, please use the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
        : `Pour ça, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`;
    }

    return { statusCode: 200, headers, body: JSON.stringify({ reply: ai }) };
  } catch (e) {
    console.error("Chatboot error:", e);
    // Pas de 500 côté UI : on renvoie un fallback propre
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: `Je peux t’aider à naviguer / I can help you navigate 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès / Access</a>.`
      })
    };
  }
};
