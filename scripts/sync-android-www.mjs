import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "www");

if (output !== join(root, "www")) {
  throw new Error(`Refusing to replace unexpected Android web directory: ${output}`);
}

const files = [
  "404.html",
  "CNAME",
  "import-drip.html",
  "index.html",
  "legal.html",
  "manifest.json",
  "robots.txt",
  "service-worker.js",
  "sitemap.xml",
  "style.css",
  "style-desktop.css",
];
const directories = ["fonts", "icons", "js", "logo"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  await cp(join(root, file), join(output, file));
}
for (const directory of directories) {
  await cp(join(root, directory), join(output, directory), { recursive: true });
}

console.log(`Synced Android web assets to ${output}`);
