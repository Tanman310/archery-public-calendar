import fs from "node:fs";

const INDEX_PATH = "index.html";
const html = fs.readFileSync(INDEX_PATH, "utf8");

// Match: const CSV_URL = "....";
const m = html.match(/const\s+CSV_URL\s*=\s*"([^"]*)"\s*;/);

if (!m) {
    console.error(`Config check failed: Could not find CSV_URL in ${INDEX_PATH}.`);
    process.exit(1);
}

const url = m[1].trim();

const disallowed = new Set([
    "",
    "YOUR_CSV_URL_HERE",
    "PASTE_YOUR_PUBLIC_EVENTS_CSV_URL_HERE",
    "PASTE_YOUR_CSV_URL_HERE"
]);

if (disallowed.has(url)) {
    console.error(`Config check failed: CSV_URL is a placeholder or empty: "${url}"`);
    process.exit(1);
}

// Require published Google Sheets CSV form (what you use today)
const looksLikeGoogleSheets =
    url.startsWith("https://docs.google.com/spreadsheets/") ||
    url.startsWith("http://docs.google.com/spreadsheets/");

if (!looksLikeGoogleSheets) {
    console.error(`Config check failed: CSV_URL is not a docs.google.com/spreadsheets URL: "${url}"`);
    process.exit(1);
}

const requiresCsv = /[?&]output=csv\b/.test(url);
if (!requiresCsv) {
    console.error(`Config check failed: CSV_URL must include output=csv: "${url}"`);
    process.exit(1);
}

// Recommended parameters for your published tab URLs
const hasGid = /[?&]gid=\d+\b/.test(url);
const hasSingle = /[?&]single=true\b/.test(url);

if (!hasGid) {
    console.warn(`Config check warning: CSV_URL does not include gid=... (continuing).`);
}
if (!hasSingle) {
    console.warn(`Config check warning: CSV_URL does not include single=true (continuing).`);
}

console.log("Config check passed: CSV_URL looks valid.");
process.exit(0);