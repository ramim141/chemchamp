import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PUBLIC_CHAPTERS } from "../src/data/publicChapters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

const DOMAIN = "https://chemchamp.com";
const TODAY = new Date().toISOString().split("T")[0];

if (!fs.existsSync(distDir)) {
  console.error("❌ dist directory does not exist. Run vite build first!");
  process.exit(1);
}

const templatePath = path.join(distDir, "index.html");
const templateHtml = fs.readFileSync(templatePath, "utf8");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPrerenderedHtml({
  title,
  description,
  path: pagePath,
  jsonLd,
  bodyContent,
  noindex = false,
}) {
  let html = templateHtml;
  const canonicalUrl = `${DOMAIN}${pagePath}`;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(title)}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/is,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // Replace Canonical Link
  html = html.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // Replace Open Graph URL, Title, Description
  html = html.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );

  // Replace Twitter Title & Description
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // Robots meta
  if (noindex) {
    if (!html.includes('name="robots"')) {
      html = html.replace(
        "</head>",
        '  <meta name="robots" content="noindex, nofollow" />\n</head>'
      );
    }
  }

  // Inject or Replace Structured Data JSON-LD
  if (jsonLd) {
    const jsonLdScript = `\n  <script type="application/ld+json">\n${JSON.stringify(
      jsonLd,
      null,
      2
    )}\n  </script>`;
    // Check if there is already an existing application/ld+json block
    if (html.includes('type="application/ld+json"')) {
      // Append right before </head>
      html = html.replace("</head>", `${jsonLdScript}\n</head>`);
    } else {
      html = html.replace("</head>", `${jsonLdScript}\n</head>`);
    }
  }

  // Inject Pre-rendered Semantic Body inside <div id="root">
  if (bodyContent) {
    const rootRegex = /<div id="root">(.*?)<\/div>/s;
    html = html.replace(
      rootRegex,
      `<div id="root">\n  <div data-prerendered="true" class="crawler-prerender-content">\n${bodyContent}\n  </div>\n</div>`
    );
  }

  return html;
}

console.log("🚀 Starting ChemChamp Static HTML Pre-rendering...");

// 1. Generate /chemistry/index.html
const chemistryIndexDir = path.join(distDir, "chemistry");
fs.mkdirSync(chemistryIndexDir, { recursive: true });

const chemistryListHtml = `
<nav aria-label="Breadcrumb" style="padding: 1rem; font-size: 0.875rem;">
  <a href="/">হোম</a> &gt; <span>রসায়ন পাঠসমূহ</span>
</nav>
<header style="max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem;">
  <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">HSC ও এডমিশন কেমিস্ট্রি অধ্যায়ভিত্তিক পাঠ ও সম্পূর্ণ সিলেবাস</h1>
  <p style="font-size: 1rem; color: #4b5563; line-height: 1.6;">HSC রসায়ন ১ম ও ২য় পত্রের অধ্যায়ভিত্তিক সম্পূর্ণ সিলেবাস, বোর্ড স্ট্যান্ডার্ড সূত্রাবলী এবং বিগত বছরের মেডিকেল, বুয়েট ও ভার্সিটি এডমিশন প্রশ্নব্যাংক।</p>
</header>
<main style="max-width: 800px; margin: 0 auto; padding: 1rem;">
  <div style="display: grid; gap: 1rem;">
    ${PUBLIC_CHAPTERS.map(
      (ch) => `
      <article style="border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.25rem;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase;">${escapeHtml(
          ch.paperName
        )} • অধ্যায় ${ch.chapterNumber}</span>
        <h2 style="font-size: 1.25rem; font-weight: bold; margin: 0.25rem 0;">
          <a href="/chemistry/${escapeHtml(ch.slug)}" style="color: #111827; text-decoration: none;">${escapeHtml(
            ch.title
          )}</a>
        </h2>
        <p style="font-size: 0.875rem; color: #4b5563; margin: 0.5rem 0 1rem;">${escapeHtml(
          ch.summary
        )}</p>
        <a href="/chemistry/${escapeHtml(
          ch.slug
        )}" style="color: #059669; font-weight: 600; text-decoration: underline; font-size: 0.875rem;">সম্পূর্ণ অধ্যায় ও MCQ প্র্যাকটিস দেখুন &rarr;</a>
      </article>
    `
    ).join("\n")}
  </div>
</main>
`;

const chemistryIndexHtml = buildPrerenderedHtml({
  title: "HSC কেমিস্ট্রি অধ্যায়ভিত্তিক পাঠ ও সিলেবাস | ChemChamp",
  description:
    "HSC রসায়ন ১ম ও ২য় পত্রের সম্পূর্ণ অধ্যায়ভিত্তিক সিলেবাস নোট, গুরুত্বপূর্ণ সূত্র এবং বিগত বছরের বোর্ড ও এডমিশন স্ট্যান্ডার্ড প্রশ্নব্যাংক।",
  path: "/chemistry",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "HSC ও এডমিশন কেমিস্ট্রি অধ্যায়ভিত্তিক পাঠ ও সিলেবাস",
    "description":
      "HSC রসায়ন ১ম ও ২য় পত্রের অধ্যায়ভিত্তিক সম্পূর্ণ সিলেবাস, মূল ধারণাসমূহ, সূত্র ও বিগত বছরের বোর্ড-বুয়েট স্ট্যান্ডার্ড মডেল প্রশ্ন।",
    "url": `${DOMAIN}/chemistry`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "ChemChamp",
      "url": DOMAIN,
    },
  },
  bodyContent: chemistryListHtml,
});

fs.writeFileSync(path.join(chemistryIndexDir, "index.html"), chemistryIndexHtml, "utf8");
console.log("  ✓ Generated: dist/chemistry/index.html");

// 2. Generate /chemistry/:chapterSlug/index.html for each chapter
for (const ch of PUBLIC_CHAPTERS) {
  const chapterDir = path.join(chemistryIndexDir, ch.slug);
  fs.mkdirSync(chapterDir, { recursive: true });

  const chapterBodyHtml = `
<nav aria-label="Breadcrumb" style="padding: 1rem; font-size: 0.875rem;">
  <a href="/">হোম</a> &gt; <a href="/chemistry">রসায়ন পাঠসমূহ</a> &gt; <span>${escapeHtml(
    ch.title
  )}</span>
</nav>
<main style="max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem;">
  <header style="margin-bottom: 2rem;">
    <span style="font-size: 0.75rem; font-weight: 600; color: #059669; text-transform: uppercase;">${escapeHtml(
      ch.paperName
    )} • অধ্যায় ${ch.chapterNumber}</span>
    <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 0.5rem; margin-bottom: 0.75rem; color: #111827;">${escapeHtml(
      ch.title
    )}</h1>
    <p style="font-size: 1.125rem; color: #4b5563; line-height: 1.6;">${escapeHtml(ch.summary)}</p>
  </header>

  <section aria-labelledby="overview-heading" style="margin-bottom: 2.5rem;">
    <h2 id="overview-heading" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">অধ্যায় পরিচিতি ও বিস্তারিত আলোচনা</h2>
    <div style="font-size: 1rem; line-height: 1.8; color: #374151;">
      ${ch.overview
        .split("\n\n")
        .map((p) => `<p style="margin-bottom: 1rem;">${escapeHtml(p)}</p>`)
        .join("\n")}
    </div>
  </section>

  ${
    ch.keyConcepts && ch.keyConcepts.length > 0
      ? `
  <section aria-labelledby="concepts-heading" style="margin-bottom: 2.5rem;">
    <h2 id="concepts-heading" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">গুরুত্বপূর্ণ কনসেপ্ট ও সমীকরণ</h2>
    <div style="display: grid; gap: 1rem;">
      ${ch.keyConcepts
        .map(
          (c) => `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; background-color: #f9fafb;">
          <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: #111827;">${escapeHtml(
            c.title
          )}</h3>
          <p style="font-size: 0.875rem; color: #4b5563; margin-bottom: 0.5rem;">${escapeHtml(
            c.description
          )}</p>
          ${
            c.formula
              ? `<code style="display: block; background: #ffffff; padding: 0.5rem; border-radius: 0.25rem; border: 1px solid #e5e7eb; font-family: monospace;">${escapeHtml(
                  c.formula
                )}</code>`
              : ""
          }
        </div>
      `
        )
        .join("\n")}
    </div>
  </section>
  `
      : ""
  }

  ${
    ch.importantFormulas && ch.importantFormulas.length > 0
      ? `
  <section aria-labelledby="formulas-heading" style="margin-bottom: 2.5rem;">
    <h2 id="formulas-heading" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">প্রয়োজনীয় সূত্র ও সমীকরণ তালিকা</h2>
    <div style="display: grid; gap: 0.75rem;">
      ${ch.importantFormulas
        .map(
          (f) => `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
          <strong style="display: block; font-size: 0.875rem; color: #111827; margin-bottom: 0.25rem;">${escapeHtml(
            f.name
          )}</strong>
          <code style="display: block; background: #f3f4f6; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace;">${escapeHtml(
            f.formula || f.latex
          )}</code>
          ${
            f.note
              ? `<small style="color: #6b7280; display: block; margin-top: 0.25rem;">নোট: ${escapeHtml(
                  f.note
                )}</small>`
              : ""
          }
        </div>
      `
        )
        .join("\n")}
    </div>
  </section>
  `
      : ""
  }

  ${
    ch.sampleMcqs && ch.sampleMcqs.length > 0
      ? `
  <section aria-labelledby="mcq-heading" style="margin-bottom: 2.5rem;">
    <h2 id="mcq-heading" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">নমুনা বোর্ড ও এডমিশন প্রশ্ন (ব্যাখ্যাসহ)</h2>
    <div style="display: grid; gap: 1rem;">
      ${ch.sampleMcqs
        .map(
          (m, idx) => `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
          <p style="font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem; color: #111827;">${
            idx + 1
          }. ${escapeHtml(m.question)}</p>
          <ul style="list-style-type: none; padding-left: 0; margin: 0.5rem 0;">
            ${m.options
              .map(
                (opt, oIdx) => `
              <li style="padding: 0.375rem 0.5rem; margin-bottom: 0.25rem; border-radius: 0.25rem; ${
                oIdx === (m.answerIndex ?? m.answer)
                  ? "background-color: #d1fae5; color: #065f46; font-weight: 600;"
                  : "color: #4b5563;"
              }">
                ${["(ক)", "(খ)", "(গ)", "(ঘ)"][oIdx] || oIdx + 1} ${escapeHtml(opt)}
                ${oIdx === (m.answerIndex ?? m.answer) ? " ✓ (সঠিক উত্তর)" : ""}
              </li>
            `
              )
              .join("\n")}
          </ul>
          <p style="font-size: 0.875rem; color: #374151; background: #f9fafb; padding: 0.75rem; border-radius: 0.25rem; border-left: 3px solid #10b981; margin-top: 0.5rem;">
            <strong>ব্যাখ্যা: </strong>${escapeHtml(m.explanation)}
          </p>
        </div>
      `
        )
        .join("\n")}
    </div>
  </section>
  `
      : ""
  }

  <section style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.75rem; padding: 1.5rem; text-align: center; margin: 2rem 0;">
    <h2 style="font-size: 1.25rem; font-weight: 700; color: #065f46; margin-bottom: 0.5rem;">এই অধ্যায়ের ২০০+ রিয়েল MCQ টেস্ট দিন</h2>
    <p style="font-size: 0.875rem; color: #047857; margin-bottom: 1rem;">ChemChamp অ্যাপে বোর্ড ও বিগত এডমিশন প্রশ্ন টাইমার সহ সলভ করুন এবং লাইভ লিডারবোর্ডে নিজের অবস্থান জানুন।</p>
    <a href="/login" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none;">ফ্রি প্র্যাকটিস শুরু করুন &rarr;</a>
  </section>
</main>
`;

  const chapterHtml = buildPrerenderedHtml({
    title: ch.metaTitle,
    description: ch.metaDescription,
    path: `/chemistry/${ch.slug}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": ch.title,
      "description": ch.metaDescription,
      "url": `${DOMAIN}/chemistry/${ch.slug}`,
      "educationalLevel": "Higher Secondary (HSC) & University Admission",
      "inLanguage": "bn",
      "teaches": ch.summary,
      "learningResourceType": "Study Guide & Practice MCQs",
      "provider": {
        "@type": "EducationalOrganization",
        "name": "ChemChamp",
        "url": DOMAIN,
      },
    },
    bodyContent: chapterBodyHtml,
  });

  fs.writeFileSync(path.join(chapterDir, "index.html"), chapterHtml, "utf8");
  console.log(`  ✓ Generated: dist/chemistry/${ch.slug}/index.html`);
}

// 3. Generate dynamic sitemap.xml in dist/
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${DOMAIN}/chemistry</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${PUBLIC_CHAPTERS.map(
  (ch) => `  <url>
    <loc>${DOMAIN}/chemistry/${ch.slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
).join("\n")}
  <url>
    <loc>${DOMAIN}/login</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`;

fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemapXml, "utf8");
// Also update public/sitemap.xml so git has the latest
fs.writeFileSync(path.resolve(__dirname, "../public/sitemap.xml"), sitemapXml, "utf8");
console.log("  ✓ Generated: dist/sitemap.xml & updated public/sitemap.xml");

console.log("✅ Static HTML Pre-rendering & Sitemap generation completed successfully!");

