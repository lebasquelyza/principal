const QUESTIONNAIRE_URL = "https://files-coaching.com/questionnaire.html";
const CONTACT_EMAIL = "sportifandpro@gmail.com";
const includesAny = (t,a)=>a.some(k=>t.includes(k));

function siteHelp(msg){
  if (includesAny(msg, ["questionnaire","accès","acces","formulaire"]))
    return `Tu peux accéder au questionnaire ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  if (includesAny(msg, ["contact","mail","email","e-mail"]))
    return `Écris-nous à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
  if (includesAny(msg, ["bug","erreur","problème","probleme","marche pas","je n'arrive pas","je narrive pas"]))
    return `Pas de souci ! Dis-moi ce qui bloque et je te guide. Tu peux aussi recharger (⌘⇧R) ou aller ici : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">questionnaire</a>.`;
  return null;
}
function training(msg){
  if (includesAny(msg, ["séance","seance","exercice","programme","entrain","workout","plan d'entraînement","plan d entrainement"]))
    return `Pour des séances/exercices adaptés, passe par le questionnaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  return null;
}
function nutrition(msg){
  if (includesAny(msg, ["nutrition","recette","recettes","repas","manger","alimentation","calories","macro"]))
    return `Je ne fournis pas de plan nutrition ni de recettes exactes ici. Pour du personnalisé : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
  return null;
}
function hello(msg){
  if (includesAny(msg, ["bonjour","salut","hello","cc","coucou"]))
    return "Salut grand(e) sportif(ve) 👋 comment puis-je t’aider ? (pour des séances précises, clique « Accès au questionnaire »)";
  return null;
}

exports.handler = async (event) => {
  try {
    const headers = { "Content-Type": "application/json" };
    // Permet de tester en ouvrant l’URL directe
    if (event.httpMethod === "GET") {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: "Dis-moi ce dont tu as besoin 🙂" }) };
    }
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim().toLowerCase();

    const r = hello(message) || siteHelp(message) || training(message) || nutrition(message)
      || `Je peux t’aider à naviguer sur le site, ou te rediriger vers le questionnaire : <a href="${QUESTIONNAIRE_URL}" target="_blank" rel="noopener">Accès au questionnaire</a>.`;
    return { statusCode: 200, headers, body: JSON.stringify({ reply: r }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "server_error" }) };
  }
};
