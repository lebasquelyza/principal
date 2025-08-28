// netlify/functions/chatboot.js
// Chatbot Files — Règles verrouillées + IA OpenAI-compatible (FR/EN)

const QUESTIONNAIRE_URL = "questionnaire-files.netlify.app";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

// ---------- Helpers ----------
const low = s => (s || "").toLowerCase();
const any = (t, arr) => arr.some(k => t.includes(k));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const isEmpty = v => !v || !String(v).trim();

function detectLang(msg) {
  // très simple : si mots anglais présents → EN, sinon FR
  if (any(msg, ["hello","hi","hey","workout","training","plan","price","food","nutrition"])) return "en";
  return "fr";
}

// ---------- Banques de réponses (variété locale) ----------
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
    ],
    toFormFood: [
      `Je ne fournis pas de plan/recettes exactes ici 😉 Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `Pas de nutrition détaillée dans le chat. On le fait après questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
    ],
    toFormPrice: [
      `Les tarifs dépendent de tes objectifs. Oriente-toi via le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
      `On personnalise aussi le budget. D’abord le questionnaire, et on te dit tout 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`,
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
    ]
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
    ],
    toFormFood: [
      `I don’t provide exact meal plans here 😉 For a custom diet: <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `No detailed nutrition in chat. We do that after the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
    ],
    toFormPrice: [
      `Prices depend on your goals. Please go through the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
      `We personalize the budget too. Start with the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`,
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
    ]
  }
};

// ---------- Intent detection ----------
const K = {
  fr: {
    hello: ["bonjour","salut","coucou","yo"],
    form:  ["questionnaire","formulaire","accès","acces","inscription"],
    bug:   ["bug","erreur","problème","probleme","marche pas","bloqué","bloquee","bloque","je n'arrive pas","je narrive pas"],
    price: ["prix","tarif","abonnement","payer","paiement","combien","€","euro"],
    train: ["séance","seance","exercice","exos","programme","entrain","workout","routine","planning","plan d'entraînement","plan d entrainement"],
    food:  ["nutrition","recette","repas","manger","alimentation","macro","calorie","calories","protéine","proteine","glucide","lipide"],
    gear:  ["matériel","materiel","équipement","equipement","haltère","barre","élastique","tapis","chaussure","chaussures"],
    recover:["récup","recup","sommeil","étirement","etirement","stretch","courbature","hydratation"],
    motivate:["motivation","démarrer","demarrer","commencer","reprise","reprendre","régularité","regularite","discipline"]
  },
  en: {
    hello: ["hello","hi","hey"],
    form:  ["form","questionnaire","register","sign up","signup","sign-up"],
    bug:   ["bug","error","issue","problem","doesn't work","stuck"],
    price: ["price","cost","plan","subscription","pay","euro","€"],
    train: ["session","exercise","workout","program","routine","training","plan"],
    food:  ["food","nutrition","diet","meal","recipe","protein","carb","fat","calorie"],
    gear:  ["equipment","gear","dumbbell","bar","elastic","band","mat","shoes"],
    recover:["recover","recovery","sleep","stretch","rest","hydration","sore"],
    motivate:["motivation","start","restart","discipline","regularity","consistency"]
  }
};

function detectIntent(lang, msg) {
  const keys = K[lang];
  if (any(msg, keys.hello))    return "hello";
  if (any(msg, keys.form))     return "form";
  if (any(msg, keys.bug))      return "bug";
  if (any(msg, keys.price))    return "price";
  if (any(msg, keys.train))    return "train";
  if (any(msg, keys.food))     return "food";
  if (any(msg, keys.gear))     return "gear";
  if (any(msg, keys.recover))  return "recover";
  if (any(msg, keys.motivate)) return "motivate";
  return "other";
}

// ---------- Règles bloquantes ----------
function policyAnswer(lang, msg) {
  const r = R[lang];
  const it = detectIntent(lang, msg);
  if (it === "price") return pick(r.toFormPrice);
  if (it === "train") return pick(r.toFormTrain);
  if (it === "food")  return pick(r.toFormFood);
  return null;
}

// ---------- Appel IA (OpenAI-compatible Chat Completions) ----------
async function callLLM({ userMessage, lang }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model  = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base   = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const systemFr = [
    "Tu es Files, assistant de coaching sportif du site files-coaching.com.",
    "Règles : ne JAMAIS donner de séance complète, ni de plan nutrition/recettes exactes, ni de prix.",
    "Si l’utilisateur demande ça → renvoyer vers le questionnaire (lien fourni par l’orchestrateur).",
    "Réponds en 1–3 phrases, ton positif, utile. Aide navigation si besoin."
  ].join("\n");

  const systemEn = [
    "You are Files, a fitness coaching assistant for files-coaching.com.",
    "Rules: NEVER provide full workouts, exact nutrition/recipes, or pricing.",
    "If the user asks for that → redirect them to the questionnaire (link provided by the orchestrator).",
    "Answer in 1–3 sentences, helpful tone. Help navigation when needed."
  ].join("\n");

  const system = (lang === "en") ? systemEn : systemFr;
  const styleHint = (lang === "en")
    ? "Answer briefly (1–3 sentences)."
    : "Réponds brièvement (1–3 phrases).";

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
        { role: "user", content: `${userMessage}\n\n${styleHint}` }
      ],
      temperature: 0.5
    })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`LLM error ${res.status}: ${t}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || (lang === "en"
    ? "I’m not sure I understood."
    : "Je ne suis pas sûr d’avoir compris.");
}

// ---------- Handler ----------
exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };

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

    // 1) Règles bloquantes en priorité
    const pol = policyAnswer(lang, msgL);
    if (pol) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pol }) };
    }

    // 2) Intent simple (FYI: pour quelques réponses rapides sans IA)
    const it = detectIntent(lang, msgL);
    if (it === "hello") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R[lang].hello) }) };
    }
    if (it === "bug") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R[lang].bug) }) };
    }
    if (it === "gear") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R[lang].gear) }) };
    }
    if (it === "recover") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R[lang].recover) }) };
    }
    if (it === "motivate") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: pick(R[lang].motivate) }) };
    }

    // 3) Sinon → IA
    let ai = await callLLM({ userMessage: message, lang });

    // 4) Post-filtre de sécurité (si le modèle s’emballe)
    const bad = /(recette|recipes?|meal plan|nutrition plan|full (workout|program)|séance complète|prix|tarif|price)/i;
    if (bad.test(ai)) {
      ai = (lang === "en")
        ? `For that, please use the form 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Access form</a>.`
        : `Pour ça, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès</a>.`;
    }

    return { statusCode: 200, headers, body: JSON.stringify({ reply: ai }) };
  } catch (e) {
    console.error("Function crash:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }
};
