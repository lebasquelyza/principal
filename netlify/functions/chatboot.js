// netlify/functions/chatboot.js (version test MINIMALE)
exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  // Test direct dans le navigateur
  if (event.httpMethod === "GET") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, reply: "Ping OK ✅" }) };
  }

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let message = "";
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    message = String(body.message || "").trim();
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ reply: message ? `Tu as dit: ${message}` : "Dis-moi quelque chose 🙂" })
  };
};
