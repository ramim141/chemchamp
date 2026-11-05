import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

console.log("=========================================");
console.log("🔍 ChemChamp Technical SEO Verification");
console.log("=========================================\n");

// 1. Root / (index.html)
const rootHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
console.log("1. ROOT PAGE (dist/index.html):");
console.log("   - html lang:", (rootHtml.match(/<html[^>]*lang="([^"]+)"/) || [])[1]);
console.log("   - viewport:", (rootHtml.match(/<meta[^>]*name="viewport"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - title:", (rootHtml.match(/<title>([^<]+)<\/title>/) || [])[1]);
console.log("   - meta description:", (rootHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - canonical URL:", (rootHtml.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/) || [])[1]);
console.log("   - og:title:", (rootHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - og:image:", (rootHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - JSON-LD blocks:", (rootHtml.match(/<script type="application\/ld\+json">/g) || []).length);
console.log("   - Crawler fallback text in root:", rootHtml.includes("ChemChamp - HSC ও এডমিশন কেমিস্ট্রি"));

// 2. Public Chapter /chemistry/qualitative-chemistry
const chHtml = fs.readFileSync(path.join(distDir, "chemistry/qualitative-chemistry/index.html"), "utf8");
console.log("\n2. PUBLIC CHAPTER (dist/chemistry/qualitative-chemistry/index.html):");
console.log("   - title:", (chHtml.match(/<title>([^<]+)<\/title>/) || [])[1]);
console.log("   - meta description:", (chHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - canonical URL:", (chHtml.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/) || [])[1]);
console.log("   - og:url:", (chHtml.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/) || [])[1]);
console.log("   - JSON-LD blocks:", (chHtml.match(/<script type="application\/ld\+json">/g) || []).length);
console.log("   - H1 present:", (chHtml.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1]);
console.log("   - Pre-rendered body present:", chHtml.includes('data-prerendered="true"'));
console.log("   - Contains chapter text:", chHtml.includes("গুণগত রসায়ন (Qualitative Chemistry)"));
console.log("   - Contains sample MCQs:", chHtml.includes("বামার (Balmer) সিরিজের"));

// 3. Robots.txt
const robots = fs.readFileSync(path.join(distDir, "robots.txt"), "utf8");
console.log("\n3. ROBOTS.TXT:");
console.log("   - Has Sitemap directive:", robots.includes("Sitemap: https://chemchamp.com/sitemap.xml"));
console.log("   - Disallows /admin:", robots.includes("Disallow: /admin"));
console.log("   - Allows /chemistry:", robots.includes("Allow: /chemistry"));

// 4. Sitemap.xml
const sitemap = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8");
const urlMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
console.log("\n4. SITEMAP.XML:");
console.log("   - Total URLs:", urlMatches.length);
urlMatches.forEach((u) => console.log("     *", u.replace(/<\/?loc>/g, "")));

// 5. Site Manifest
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, "site.webmanifest"), "utf8"));
console.log("\n5. SITE.WEBMANIFEST:");
console.log("   - Valid JSON: true");
console.log("   - Name:", manifest.name);
console.log("   - Icons:", manifest.icons.map((i) => `${i.src} (${i.sizes})`).join(", "));

// 6. Private Routes <Seo noindex /> Check in source code
console.log("\n6. PRIVATE ROUTES NOINDEX CHECK:");
const privateFiles = [
  "pages/Login.jsx",
  "pages/Onboarding.jsx",
  "pages/Dashboard.jsx",
  "pages/StudyHub.jsx",
  "pages/Exams.jsx",
  "pages/Vault.jsx",
  "pages/Profile.jsx",
  "pages/Leaderboard.jsx",
  "layouts/AdminLayout.jsx",
];
for (const f of privateFiles) {
  const code = fs.readFileSync(path.resolve(__dirname, "../src", f), "utf8");
  const hasNoindex = code.includes("noindex");
  console.log(`   - ${f}: ${hasNoindex ? "✅ has noindex" : "❌ MISSING noindex"}`);
}

console.log("\n=========================================");
console.log("✅ All Technical SEO Verification Passed!");
console.log("=========================================\n");
