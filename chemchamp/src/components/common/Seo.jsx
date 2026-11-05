import { useEffect } from "react";

const BASE_URL = "https://chemchamp.com";
const DEFAULT_TITLE = "ChemChamp | HSC ও মেডিকেল-ইঞ্জিনিয়ারিং কেমিস্ট্রি লার্নিং প্ল্যাটফর্ম";
const DEFAULT_DESC =
  "ChemChamp - HSC ও এডমিশন কেমিস্ট্রি প্রস্তুতির জন্য বাংলাদেশের প্রথম পূর্ণাঙ্গ স্মার্ট লার্নিং প্ল্যাটফর্ম। অধ্যায়ভিত্তিক সিলেবাস, রিয়েল ওএমআর মক টেস্ট, বস ফাইট ও কেমিস্ট্রি ভল্ট।";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function setMetaTag(name, content, isProperty = false) {
  if (!content) return;
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!data) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = "",
  noindex = false,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  jsonLd = null,
  breadcrumbs = null,
}) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title
      ? title.includes("ChemChamp")
        ? title
        : `${title} | ChemChamp`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Meta description & robots
    setMetaTag("description", description);
    if (noindex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // 3. Canonical URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const canonicalUrl = `${BASE_URL}${cleanPath === "/" ? "/" : cleanPath}`;
    setCanonical(canonicalUrl);

    // 4. Open Graph
    setMetaTag("og:title", formattedTitle, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:type", ogType, true);
    setMetaTag("og:image", ogImage, true);
    setMetaTag("og:locale", "bn_BD", true);
    setMetaTag("og:site_name", "ChemChamp", true);

    // 5. Twitter Card
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", formattedTitle);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", ogImage);

    // 6. JSON-LD Structured Data
    if (jsonLd) {
      setJsonLd("page-jsonld", jsonLd);
    } else {
      setJsonLd("page-jsonld", null);
    }

    // 7. BreadcrumbList JSON-LD
    if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: crumb.name,
          item: crumb.item.startsWith("http") ? crumb.item : `${BASE_URL}${crumb.item}`,
        })),
      };
      setJsonLd("breadcrumb-jsonld", breadcrumbData);
    } else {
      setJsonLd("breadcrumb-jsonld", null);
    }
  }, [title, description, path, noindex, ogImage, ogType, jsonLd, breadcrumbs]);

  return null;
}

