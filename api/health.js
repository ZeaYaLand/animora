// Lightweight diagnostics for the deployed ANIMORA frontend.
// This endpoint reports reachability only; it does not guarantee catalog quality.
const PROVIDERS = [
  {
    name: "AniList",
    url: "https://graphql.anilist.co",
    method: "POST",
    headers: { "content-type": "application/json", "accept": "application/json" },
    body: JSON.stringify({ query: "{ Page(page: 1, perPage: 1) { media(type: ANIME) { id } } }" }),
  },
  {
    name: "Jikan",
    url: "https://api.jikan.moe/v4/anime?limit=1",
    headers: { accept: "application/json" },
  },
  {
    name: "Kitsu",
    url: "https://kitsu.io/api/edge/anime?page%5Blimit%5D=1",
    headers: { accept: "application/vnd.api+json" },
  },
  {
    name: "Tenrai",
    url: "https://api.tenrai.org/v1/anime?page=1&limit=1",
    headers: { accept: "application/json" },
  },
];

async function checkProvider(provider) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(provider.url, {
      method: provider.method || "GET",
      headers: provider.headers,
      body: provider.body,
      signal: controller.signal,
    });
    let validJson = false;
    try {
      const payload = await response.json();
      validJson = !!payload && typeof payload === "object";
    } catch (_) {
      validJson = false;
    }
    return {
      provider: provider.name,
      reachable: response.ok && validJson,
      httpStatus: response.status,
      validJson,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      provider: provider.name,
      reachable: false,
      error: error && error.name === "AbortError" ? "timeout" : "request_failed",
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const providers = await Promise.all(PROVIDERS.map(checkProvider));
  const reachableCount = providers.filter((item) => item.reachable).length;
  return res.status(200).json({
    service: "ANIMORA",
    diagnostic: true,
    checkedAt: new Date().toISOString(),
    summary: { reachable: reachableCount, total: providers.length },
    providers,
    note: "Reachability checks do not guarantee that search, genres, or the full catalog work.",
  });
};
