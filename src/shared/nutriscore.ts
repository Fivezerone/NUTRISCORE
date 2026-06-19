export type NutritionFacts = {
  energyKj?: number;
  sugarsG?: number;
  saturatedFatG?: number;
  sodiumMg?: number;
  fiberG?: number;
  proteinG?: number;
  fruitVegNutsPercent?: number;
  beverage?: boolean;
  cheese?: boolean;
};

export type NutriScoreLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export type NutriScoreResult = {
  letter: NutriScoreLetter;
  score: number;
  negativePoints: number;
  positivePoints: number;
  components: Record<string, number>;
};

function pointsFromThresholds(value: number | undefined, thresholds: number[]) {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return 0;
  }

  const amount = value ?? 0;
  let points = 0;
  thresholds.forEach((threshold) => {
    if (amount > threshold) {
      points += 1;
    }
  });
  return points;
}

function fruitPoints(percent: number | undefined) {
  if (!Number.isFinite(percent ?? Number.NaN)) {
    return 0;
  }

  const amount = percent ?? 0;
  if (amount >= 80) return 5;
  if (amount >= 60) return 2;
  if (amount >= 40) return 1;
  return 0;
}

function fiberPoints(fiberG: number | undefined) {
  if (!Number.isFinite(fiberG ?? Number.NaN)) {
    return 0;
  }

  const amount = fiberG ?? 0;
  if (amount >= 4.7) return 5;
  if (amount >= 3.7) return 4;
  if (amount >= 2.8) return 3;
  if (amount >= 1.9) return 2;
  if (amount >= 0.9) return 1;
  return 0;
}

function proteinPoints(proteinG: number | undefined) {
  if (!Number.isFinite(proteinG ?? Number.NaN)) {
    return 0;
  }

  const amount = proteinG ?? 0;
  if (amount >= 8.0) return 5;
  if (amount >= 6.4) return 4;
  if (amount >= 4.8) return 3;
  if (amount >= 3.2) return 2;
  if (amount >= 1.6) return 1;
  return 0;
}

function negativeEnergyPoints(energyKj: number | undefined) {
  return pointsFromThresholds(energyKj, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]);
}

function negativeSugarPoints(sugarsG: number | undefined) {
  return pointsFromThresholds(sugarsG, [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]);
}

function negativeSatFatPoints(saturatedFatG: number | undefined) {
  return pointsFromThresholds(saturatedFatG, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
}

function negativeSodiumPoints(sodiumMg: number | undefined) {
  return pointsFromThresholds(sodiumMg, [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]);
}

export function computeNutriScore(facts: NutritionFacts): NutriScoreResult {
  const energy = negativeEnergyPoints(facts.energyKj);
  const sugars = negativeSugarPoints(facts.sugarsG);
  const satFat = negativeSatFatPoints(facts.saturatedFatG);
  const sodium = negativeSodiumPoints(facts.sodiumMg);
  const negativePoints = energy + sugars + satFat + sodium;

  const fruit = fruitPoints(facts.fruitVegNutsPercent);
  const fiber = fiberPoints(facts.fiberG);
  const protein = proteinPoints(facts.proteinG);
  const positivePoints = fruit + fiber + protein;

  let score = negativePoints - positivePoints;
  if (facts.cheese) {
    score += 0;
  }

  const letter: NutriScoreLetter = score <= -1 ? 'A'
    : score <= 2 ? 'B'
      : score <= 10 ? 'C'
        : score <= 18 ? 'D'
          : 'E';

  return {
    letter,
    score,
    negativePoints,
    positivePoints,
    components: {
      energy,
      sugars,
      satFat,
      sodium,
      fruit,
      fiber,
      protein
    }
  };
}
