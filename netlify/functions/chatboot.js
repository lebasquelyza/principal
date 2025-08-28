// netlify/functions/chatboot.js
// RÈGLES :
// - Demandes de séances/exercices spécifiques → renvoi vers questionnaire (CTA), pas de plan direct.
// - Nutrition/recettes exactes → interdit ici → renvoi vers questionnaire.
// - Aide navigation (questionnaire, contact, bug) → réponses guidées.
// - En parallèle, si un e-mail est fourni, on envoie un message via Resend (optionnel).
//
// FRONT attendu : POST JSON { message: "...", email?: "..." } vers /.netlify/functions/chatboot

const QUESTIONNAIRE_URL = "questionnaires-files.netlify.app";
const CONTACT_EMAIL     = "sportifandpro@gmail.com";

const includesAny = (t, arr) => arr.some(k => t.includes(k));
const norm = (s) => (s || "").toLowerCase();

// --------- Envoi e-mail via Resend (API HTTP) ----------
async function sendResend({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM;
  const bcc    = process.env.RESEND_BCC || ""; // optionnel

  if (!apiKey || !from || !to) return; // silencieux si params manquants

  const body = {
    from,
    to,
    subject,
    text
  };
  if (bcc) body.bcc = bcc;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Resend error:", res.status, errText);
  }
}

// --------- Génération de la réponse “chat” (RÈGLES) ----------
function makeReply(msg) {
  // Salutation
  if (includesAny(msg, ["bonjour","salut","hello","cc","coucou"])) {
    return "Salut grand(e) sportif(ve) 👋 comment puis-je t’aider ? (pour des séances précises, clique sur « Accès au questionnaire »)";
  }

  // Aide navigation / support
  if (includesAny(msg, ["questionnaire","accès","acces","formulaire"])) {
    return `Tu peux accéder au questionnaire ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }
  if (includesAny(msg, ["contact","mail","email","e-mail"])) {
    return `Tu peux nous écrire à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
  }
  if (includesAny(msg, ["bug","erreur","problème","probleme","marche pas","je n'arrive pas","je narrive pas"])) {
    return `Pas de souci ! Dis-moi ce qui bloque et je te guide. Tu peux aussi actualiser (⌘⇧R) ou aller directement ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">questionnaire</a>.`;
  }

  // Séances / exercices spécifiques → CTA questionnaire (bloquant)
  if (includesAny(msg, ["séance","seance","exercice","programme","entrain","workout","plan d'entraînement","plan d entrainement"])) {
    return `Pour des séances/exercices adaptés, passe par le questionnaire 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }

  // Nutrition / recettes exactes → CTA questionnaire (bloquant)
  if (includesAny(msg, ["nutrition","recette","recettes","repas","manger","alimentation","calories","macro"])) {
    return `Je ne fournis pas de plan/recettes exactes ici. Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }

  // Tarifs
  if (includesAny(msg, ["prix","tarif","abonnement","payer","paiement"])) {
    return `Nos offres dépendent de tes objectifs. Remplis le questionnaire pour un plan adapté : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  }

  // Fallback
  return `Je peux t’aider à naviguer sur le site, ou te rediriger vers le questionnaire pour un accompagnement personnalisé 👉 <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
}

exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };

    // Test rapide en GET (ouvrir l’URL dans le navigateur)
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Chat opérationnel ✅ Dis-moi ce dont tu as besoin 🙂" }) };
    }

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();
    const email   = String(body.email || "").trim(); // facultatif (si tu ajoutes un champ email dans la bulle)
    const m = norm(message);

    if (!message) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi ce dont tu as besoin 🙂" }) };
    }

    // Réponse selon règles
    const reply = makeReply(m);

    // Envoi e-mail via Resend (optionnel, si l’utilisateur a laissé son e-mail)
    // Tu peux décider ici quand envoyer : par ex. seulement si on renvoie vers le questionnaire,
    // ou dès qu'un email est présent. Ci-dessous : envoie si email est fourni.
    if (email) {
      const plain = reply.replace(/<[^>]+>/g, ""); // version texte (sans HTML)
      await sendResend({
        to: email,
        subject: "Files Coaching — Suite à ta demande",
        text: `${plain}\n\nQuestionnaire : ${QUESTIONNAIRE_URL}\nContact : ${CONTACT_EMAIL}`
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }
};
