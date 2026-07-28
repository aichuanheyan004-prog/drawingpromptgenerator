import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const required = [
  ["index.html", "Drawing Prompt Generator"],
  [path.join("guide", "index.html"), "How to use drawing prompts"],
  [path.join("privacy", "index.html"), "Privacy Policy"],
  [path.join("terms", "index.html"), "Terms of Use"],
  ["404.html", "Page not found"],
  ["robots.txt", "Sitemap:"],
  ["sitemap.xml", "https://www.drawingpromptgenerator.net/guide/"]
];

for (const [file, text] of required) {
  const filePath = path.join(dist, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing built file: ${file}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(text)) {
    throw new Error(`Built file ${file} does not contain expected text: ${text}`);
  }
}

const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!home.includes('rel="canonical" href="https://www.drawingpromptgenerator.net/"')) {
  throw new Error("Home canonical is missing or wrong.");
}
if (!home.includes('"@type":"WebApplication"')) {
  throw new Error("WebApplication JSON-LD is missing.");
}

console.log("Built route checks passed.");
