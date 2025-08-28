// netlify/functions/chatboot.js
const QUESTIONNAIRE_URL = "questionnaire-files.netlify.app";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

// --- Helpers règles métiers ---
const lower = s => (s || "").toLowerCase();
const incAny = (t, arr) => arr.some(k => t.includes(k));

function mustRedirectToForm(msg) {
  // séances / exercices spécifiques => questionnaire
  if (incAny(msg, ["séance","seance","exercice","programme","entrain","workout","plan d'entraînement","plan d entrainement"])) {
    return true;
  }
  // nutrition/recettes exactes => questionnaire
  if (incAny(msg, ["nutrition","recette","recettes","repas","manger","alimentation","calories","macro"])) {
    return true;
  }
  return false;
}

function policyAnswer(msg) {
  if (incAny(msg, ["séance","seance","exercice","programme","entrain","workout","plan d'entraînement","plan d entrainement"])) {
    return `Pour des séances/exercices adaptés, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  if (incAny(msg, ["nutrition","recette","recettes","repas","manger","alimentation","calories","macro"])) {
    return `Je ne fournis pas de plan/recettes exactes ici. Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  return null;
}

// --- Appel LLM (OpenAI-compatible Chat Completions) ---
async function callLLM({userMessage}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const system = [
    "Tu es Files, un assistant de coaching sportif du site files-coaching.com.",
    "Objectifs:",
    "- Aider à la navigation (questionnaire, contact, résoudre un blocage).",
    "- NE PAS donner de plan nutrition ni de recettes exactes.",
    "- Si on demande des séances/exercices spécifiques → renvoyer au questionnaire.",
    "Toujours rester bref, positif, utile, et proposer un lien clair."
  ].join("\n");

  // Nudge: donne des réponses concises + CTA
  const styleHint = "Réponds en 1-3 phrases max. Propose un lien si pertinent.";

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
    const t = await res.text().catch(()=> "");
    throw new Error(`LLM error ${res.status}: ${t}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || "Je n'ai pas bien compris.";
}

exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };

    // Test GET direct (ouvre l’URL dans le navigateur pour vérifier)
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "IA prête ✅ Dis-moi ce dont tu as besoin 🙂" }) };
    }
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = JSON.parse(event.body || "{}");
    const userMessage = String(body.message || "").trim();
    const l = lower(userMessage);

    if (!userMessage) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi ce dont tu as besoin 🙂" }) };
    }

    // 1) Applique d’abord tes règles (bloquantes)
    const policy = policyAnswer(l);
    if (policy) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: policy }) };
    }

    // 2) Sinon, demande à l’IA (navigation, aide générale, etc.)
    const ai = await callLLM({ userMessage });

    // 3) Petite post-vérif : si l’IA propose quand même des recettes/plans, on filtre et renvoie vers questionnaire
    if (mustRedirectToForm(l) || /recette|macro|calorie|protéine|protéines|plan.*nutrition/i.test(ai)) {
      return { statusCode: 200, headers, body: JSON.stringify({
        reply: `Pour ça, je dois te connaître un peu mieux 🙂 Passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`
      })};
    }

    // 4) Réponse finale
    return { statusCode: 200, headers, body: JSON.stringify({ reply: ai }) };

  } catch (e) {
    console.error(e);
    const msg = String(e?.message || "server_error");
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
};
