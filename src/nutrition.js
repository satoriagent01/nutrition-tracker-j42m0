/**
 * Nutrition calculation module.
 * Pure functions for scaling nutrition facts and summing them.
 */

const DEFAULT_FIELDS = [
  'energyKj',
  'energyKcal',
  'fat',
  'saturatedFat',
  'carbohydrates',
  'sugars',
  'fiber',
  'protein',
  'salt',
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
  for (const field of DEFAULT_FIELDS) {
    result[field] = (nutritionPer100g[field] || 0) * factor;
  }
  // Preserve custom fields if present
  if (nutritionPer100g.customFields) {
    result.customFields = {};
    for (const [key, value] of Object.entries(nutritionPer100g.customFields)) {
      result.customFields[key] = value * factor;
    }
  }
  // Preserve other properties like servingSize and unit
  if (nutritionPer100g.servingSize !== undefined) {
    result.servingSize = nutritionPer100g.servingSize;
  }
  if (nutritionPer100g.unit !== undefined) {
    result.unit = nutritionPer100g.unit;
  }
  return result;
}

/**
 * Sums two nutrition fact objects field-by-field.
 * @param {Object} a - First nutrition facts
 * @param {Object} b - Second nutrition facts
 * @returns {Object} Summed nutrition facts
 */
export function sumNutrition(a, b) {
  const result = {};
  for (const field of DEFAULT_FIELDS) {
    result[field] = (a[field] || 0) + (b[field] || 0);
  }
  // Merge custom fields
  const customFields = {};
  if (a.customFields) {
    for (const [key, value] of Object.entries(a.customFields)) {
      customFields[key] = value;
    }
  }
  if (b.customFields) {
    for (const [key, value] of Object.entries(b.customFields)) {
      customFields[key] = (customFields[key] || 0) + value;
    }
  }
  if (Object.keys(customFields).length > 0) {
    result.customFields = customFields;
  }
  return result;
}

/**
 * Calculates the total nutrition for a meal from its food items.
 * Each food item has productId, grams, and nutrition (per 100g).
 * @param {Array} foodItems - Array of food items with grams and nutrition
 * @returns {Object} Total nutrition facts for the meal
 */
export function calculateMealTotal(foodItems) {
  let total = {};
  for (const field of DEFAULT_FIELDS) {
    total[field] = 0;
  }
  for (const item of foodItems) {
    const scaled = calculateNutritionForAmount(item.nutrition, item.grams);
    total = sumNutrition(total, scaled);
  }
  return total;
}

/**
 * Adds a custom field to nutrition facts.
 * @param {Object} nutrition - Nutrition facts object
 * @param {string} field - Field name
 * @param {number} value - Field value
 * @returns {Object} New nutrition facts with custom field
 */
export function addCustomField(nutrition, field, value) {
  const result = {};
  for (const f of DEFAULT_FIELDS) {
    result[f] = nutrition[f] || 0;
  }
  // Preserve existing custom fields
  if (nutrition.customFields) {
    result.customFields = { ...nutrition.customFields };
  } else {
    result.customFields = {};
  }
  result.customFields[field] = value;
  return result;
}