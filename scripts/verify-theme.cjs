const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const globals = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");
const tailwind = fs.readFileSync(path.join(root, "tailwind.config.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");

const requiredTokens = ["--care-700", "--clinic-800", "--care-100", "--clinic-100"];
for (const token of requiredTokens) {
  if (!globals.includes(token)) throw new Error(`Missing theme token: ${token}`);
}

for (const tokenClass of ["care", "clinic"]) {
  if (!tailwind.includes(`${tokenClass}:`)) throw new Error(`Missing Tailwind colour family: ${tokenClass}`);
}

for (const panelClass of ["panel--patient", "panel--doctor"]) {
  if (!globals.includes(`.${panelClass}`) || !page.includes(panelClass)) {
    throw new Error(`Landing panel is missing fail-safe class: ${panelClass}`);
  }
}

if (/[\u0900-\u097F]/u.test(page)) {
  throw new Error("Devanagari text remains in the landing page source.");
}

const interactiveTags = /<\/?(button|a|input|select|textarea)\b[^>]*>/gu;
const interactiveStack = [];
for (const match of page.matchAll(interactiveTags)) {
  const token = match[0];
  const tagName = match[1];
  if (token.startsWith("</")) {
    if (interactiveStack.at(-1) === tagName) interactiveStack.pop();
    continue;
  }
  if ((tagName === "input" || tagName === "select" || tagName === "textarea") && interactiveStack.some((tag) => tag === "button" || tag === "a")) {
    throw new Error(`Landing source contains ${tagName} nested inside an interactive element.`);
  }
  if (tagName === "button" || tagName === "a") interactiveStack.push(tagName);
}

if (!page.includes("portal-panel__trigger") || !page.includes("portal-panel__form")) {
  throw new Error("Landing panel trigger/form sibling structure is missing.");
}

console.log("Theme guard passed: tokens, fail-safe panel fills, and English-only landing source are present.");
