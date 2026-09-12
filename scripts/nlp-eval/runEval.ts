import fs from "node:fs";
import path from "node:path";

const datasetPath = path.join(__dirname, "dataset");
const goldPath = path.join(__dirname, "goldStandard.json");

const datasetFiles = fs.readdirSync(datasetPath).filter((file) => file.endsWith(".json"));
const goldData = JSON.parse(fs.readFileSync(goldPath, "utf-8"));

function computeF1(actual: number, expected: number): number {
  if (actual === 0 && expected === 0) {
    return 1;
  }
  const precision = expected === 0 ? 0 : actual / expected;
  const recall = actual === 0 ? 0 : expected / actual;
  const f1 = (2 * precision * recall) / (precision + recall || 1);
  return Number.isFinite(f1) ? f1 : 0;
}

function evaluate() {
  const results = datasetFiles.map((file) => ({
    file,
    total: 0,
    matched: 0,
    missing: 0,
    extra: 0
  }));

  console.log("NLP evaluation harness initialized");
  console.log("Dataset files:", datasetFiles.length);
  console.log("Gold standard notes:", goldData.notes.length);
  console.log("Per-field precision/recall/F1 will be generated here once the full extraction pipeline is wired in.");
  console.log("Results summary:", JSON.stringify(results, null, 2));
}

void evaluate();
