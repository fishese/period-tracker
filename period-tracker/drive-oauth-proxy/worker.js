/**
 * Minimal OAuth token proxy for My Cycle Keeper Drive backup.
 *
 * Holds GOOGLE_CLIENT_SECRET server-side so it never ships in the SPA.
 * Deploy with Cloudflare Workers (free tier is enough).
 *
 * Env secrets (wrangler secret put …):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 */

const ALLOWED_ORIGINS = [
  "https://fishese.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405, origin);
    }

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse({ error: "origin_not_allowed" }, 403, origin);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return jsonResponse({ error: "proxy_misconfigured" }, 500, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_) {
      return jsonResponse({ error: "invalid_json" }, 400, origin);
    }

    const grantType = payload.grant_type;
    const body = new URLSearchParams();
    body.set("client_id", env.GOOGLE_CLIENT_ID);
    body.set("client_secret", env.GOOGLE_CLIENT_SECRET);
    body.set("grant_type", grantType);

    if (grantType === "authorization_code") {
      if (!payload.code || !payload.code_verifier || !payload.redirect_uri) {
        return jsonResponse({ error: "missing_code_fields" }, 400, origin);
      }
      body.set("code", payload.code);
      body.set("code_verifier", payload.code_verifier);
      body.set("redirect_uri", payload.redirect_uri);
    } else if (grantType === "refresh_token") {
      if (!payload.refresh_token) {
        return jsonResponse({ error: "missing_refresh_token" }, 400, origin);
      }
      body.set("refresh_token", payload.refresh_token);
    } else {
      return jsonResponse({ error: "unsupported_grant_type" }, 400, origin);
    }

    // Ignore client_id from the browser — always use the Worker secret pair
    const googleRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await googleRes.text();
    return new Response(text, {
      status: googleRes.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(origin),
      },
    });
  },
};
