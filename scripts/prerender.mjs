import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const templatePath = path.join(dist, "index.html");
const serverEntry = path.join(root, "dist-ssr", "entry-server.js");
const { renderPage } = await import(pathToFileURL(serverEntry));

const routes = [
  { path: "/", file: "index.html" },
  { path: "/guide/", file: path.join("guide", "index.html") },
  { path: "/privacy/", file: path.join("privacy", "index.html") },
  { path: "/terms/", file: path.join("terms", "index.html") },
  { path: "/404.html", file: "404.html" }
];

const template = fs.readFileSync(templatePath, "utf8");

for (const routeConfig of routes) {
  const { html, route, jsonLd } = renderPage(routeConfig.path);
  const output = replaceMeta(template.replace("<!--app-html-->", html), route, jsonLd);
  const filePath = path.join(dist, routeConfig.file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, output, "utf8");
}

function replaceMeta(html, route, jsonLd) {
  const title = escapeAttribute(route.title);
  const description = escapeAttribute(route.description);
  const canonical = escapeAttribute(route.canonical);
  return html
    .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(
      /<script type="application\/ld\+json" data-prerender-jsonld>[\s\S]*?<\/script>/,
      `<script type="application/ld+json" data-prerender-jsonld>${JSON.stringify(jsonLd)}</script>`
    );
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
