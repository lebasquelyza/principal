// netlify/functions/chatbot.js
const QUESTIONNAIRE_URL = "https://files-coaching.com/questionnaire.html";
const CONTACT_EMAIL = "sportifandpro@gmail.com";

function includesAny(text, arr){ return arr.some(k => text.includes(k)); }

function siteHelpReply(msg){
  if (includesAny(msg, ["questionnaire","accès","acces","formulaire"])) {
    return `Tu peux accéder au questionnaire ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  if (includesAny(msg, ["contact","mail","email","e-mail"])) {
    return `Tu peux nous écrire à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
  }
  if (includesAny(msg, ["bug","erreur","problème","probleme","marche pas","je n'arrive pas","je narrive pas"])) {
    return `Pas de souci ! Dis-moi ce qui bloque et je te guide. Tu peux aussi recharger la page (⌘⇧R), ou aller directement ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">questionnaire</a>.`;
  }
  if (includesAny(msg, ["prix","tarif","abonnement","payer","paiement"])) {
    return `Nos offres dépendent de tes objectifs. Remplis le questionnaire pour un plan adapté : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  return null;
}

function trainingReply(msg){
  if (includesAny(msg, ["séance","seance","exercice","programme","entrain","workout","plan d'entraînement","plan d entrainement"])) {
    return `Pour te proposer des séances/exercices adaptés, passe par le questionnaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>. Dis-moi aussi si tu as besoin d'aide pour naviguer sur le site.`;
  }
  return null;
}

function nutritionReply(msg){
  if (includesAny(msg, ["nutrition","recette","recettes","repas","manger","alimentation","calories","macro"])) {
    return `Je ne fournis pas de plan nutrition ni de recettes exactes ici. Pour une recommandation personnalisée, complète le questionnaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  return null;
}

function greetingReply(msg){
  if (includesAny(msg, ["bonjour","salut","hello","cc","coucou"])) {
    return "Salut grand(e) sportif(ve) 👋 comment puis-je t’aider ? (si tu veux des séances précises, clique sur « Accès au questionnaire »)";
  }
  return null;
}

exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();
    const lower = message.toLowerCase();

    if (!message) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi ce dont tu as besoin 🙂" }) };
    }

    const r1 = greetingReply(lower);
    if (r1) return { statusCode: 200, headers, body: JSON.stringify({ reply: r1 }) };

    const r2 = siteHelpReply(lower);
    if (r2) return { statusCode: 200, headers, body: JSON.stringify({ reply: r2 }) };

    const r3 = trainingReply(lower);
    if (r3) return { statusCode: 200, headers, body: JSON.stringify({ reply: r3 }) };

    const r4 = nutritionReply(lower);
    if (r4) return { statusCode: 200, headers, body: JSON.stringify({ reply: r4 }) };

    const reply = `Je peux t’aider à naviguer sur le site, ou te rediriger vers le questionnaire pour un accompagnement personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>. Dis-moi ce que tu cherches 🙂`;
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }
};
