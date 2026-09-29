/**
 * Nutrition calculation module.
 */

const STANDARD_FIELDS = [
  'energyKj', 'energyKcal', 'fat', 'saturatedFat',
  'carbohydrates', 'sugars', 'fiber', 'protein', 'salt'
];

/**
 * Scales nutrition facts from per-100g to a given amount in grams.
 * @param {Object} nutritionPer100g - Nutrition facts per 100g
 * @param {number} amountGrams - Amount in grams
 * @returns {Object} Scaled nutrition facts
 */
export function calculateNutritionForAmount(nutritionPer100g, amountGrams) {
  const factor = amountGrams / 100;

  const result = {};
  for (const key of Object.keys(nutritionPer100g)) {
    if (key === 'customFields' || key === 'servingSize' || key === 'servingAmount' || key === 'unit') {
      continue;
    }
    const val = nutritionPer100g[key];
    if (typeof val === 'number') {
      result[key] = Math.round(val * factor * 1000) / 1000;
    } else {
      result[key] = val;
    }
  }

  // Preserve customFields
  if (nutritionPer100g.customFields) {
    result.customFields = { ...nutritionPer100g.customFields };
  }

  // Preserve serving info
  if (nutritionPer100g.servingSize !== undefined) {
    result.servingSize = nutritionPer100g.servingSize;
  }
  if (nutritionPer100g.servingAmount !== undefined) {
    result.servingAmount = nutritionPer100g.servingAmount;
  }
  if (nutritionPer100g.unit !== undefined) {
    result.unit = nutritionPer100g.unit;
  }

  return result;
}

/**
 * Sums all food items' nutrition in a meal.
 * @param {Array} foodItems - Array of food item objects with nutrition property
 * @returns {Object} Total nutrition
 */
export function calculateMealTotal(foodItems) {
  const total = {
    energyKj: 0,
    energyKcal: 0,
    fat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    salt: 0,
  };

  const customFields = {};

  for (const item of foodItems) {
    const n = item.nutrition;
    if (!n) continue;

    for (const key of STANDARD_FIELDS) {
      total[key] += (n[key] || 0);
    }

    if (n.customFields) {
      for (const [k, v] of Object.entries(n.customFields)) {
        if (typeof v === 'number') {
          customFields[k] = (customFields[k] || 0) + v;
        }
      }
    }
  }

  if (Object.keys(customFields).length > 0) {
    total.customFields = customFields;
  }

  return total;
}

/**
 * Sums two nutrition facts objects field by field, including customFields.
 * @param {Object} a - First nutrition facts
 * @param {Object} b - Second nutrition facts
 * @returns {Object} Summed nutrition facts
 */
export function sumNutrition(a, b) {
  const result = {};

  for (const key of STANDARD_FIELDS) {
    result[key] = (a[key] || 0) + (b[key] || 0);
  }

  // Merge customFields
  const customFields = {};
  if (a.customFields) {
    for (const [k, v] of Object.entries(a.customFields)) {
      if (typeof v === 'number') {
        customFields[k] = (customFields[k] || 0) + v;
      }
    }
  }
  if (b.customFields) {
    for (const [k, v] of Object.entries(b.customFields)) {
      if (typeof v === 'number') {
        customFields[k] = (customFields[k] || 0) + v;
      }
    }
  }

  if (Object.keys(customFields).length > 0) {
    result.customFields = customFields;
  }

  return result;
}

/**
 * Adds a custom field to nutrition facts.
 * @param {Object} nutrition - Nutrition facts object
 * @param {string} field - Custom field name
 * @param {number} value - Custom field value
 * @returns {Object} New nutrition facts with custom field added
 */
export function addCustomField(nutrition, field, value) {
  const result = { ...nutrition };
  if (!result.customFields) {
    result.customFields = {};
  }
  result.customFields[field] = value;
  return result;
}