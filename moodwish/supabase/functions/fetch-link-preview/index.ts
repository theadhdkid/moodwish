/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }

  return null;
}

function getTitle(html: string) {
  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const twitterTitle = getMetaContent(html, "twitter:title");
  if (twitterTitle) return twitterTitle;

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return decodeHtml(titleMatch[1].replace(/\s+/g, " ").trim());
  }

  return null;
}

function getImage(html: string, baseUrl: string) {
  const image =
    getMetaContent(html, "og:image") ||
    getMetaContent(html, "twitter:image") ||
    getMetaContent(html, "twitter:image:src");

  if (!image) return null;

  try {
    return new URL(image, baseUrl).toString();
  } catch {
    return image;
  }
}

function getPriceFromJsonLd(html: string) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [...html.matchAll(scriptRegex)];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const price = findPrice(item);
        if (price) return price;
      }
    } catch {
      // Ignore invalid JSON-LD
    }
  }

  return null;
}

function findPrice(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;

  if (typeof obj.price === "string" || typeof obj.price === "number") {
    return String(obj.price);
  }

  if (obj.offers) {
    const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];

    for (const offer of offers) {
      const price = findPrice(offer);
      if (price) return price;
    }
  }

  for (const child of Object.values(obj)) {
    if (Array.isArray(child)) {
      for (const entry of child) {
        const price = findPrice(entry);
        if (price) return price;
      }
    } else if (typeof child === "object") {
      const price = findPrice(child);
      if (price) return price;
    }
  }

  return null;
}

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedUrl = new URL(url).toString();

    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MOODWishBot/1.0; +https://moodwish.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Could not fetch page. Status: ${response.status}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const html = await response.text();

    const title = getTitle(html);
    const image_url = getImage(html, normalizedUrl);
    const price =
      getMetaContent(html, "product:price:amount") ||
      getMetaContent(html, "og:price:amount") ||
      getPriceFromJsonLd(html);

    return new Response(
      JSON.stringify({
        title,
        image_url,
        price,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});