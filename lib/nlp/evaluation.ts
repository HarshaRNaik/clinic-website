export type EvalMetric = {
  precision: number;
  recall: number;
  f1: number;
};

export function computeMetric(tp: number, fp: number, fn: number): EvalMetric {
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4))
  };
}

export function buildConfusionTable(actual: string[], predicted: string[]) {
  const labels = Array.from(new Set([...actual, ...predicted]));
  const table = labels.map((label) => {
    const actualCount = actual.filter((item) => item === label).length;
    const predictedCount = predicted.filter((item) => item === label).length;
    return {
      label,
      actualCount,
      predictedCount,
      delta: predictedCount - actualCount
    };
  });

  return table;
}
