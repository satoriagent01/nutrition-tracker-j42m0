/**
 * Nutrition calculation module.
 * Pure functions for scaling nutrition facts and summing them.
 */

const STANDARD_FIELDS = [
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
  for (const field of STANDARD_FIELDS) {
    result[field] = (nutritionPer100g[field] || 0) * factor;
  }
  // Preserve non-standard fields from source
  if (nutritionPer100g.customFields) {
    result.customFields = { ...nutritionPer100g.customFields };
  }
  if (nutritionPer100g.servingSize != null) {
    result.servingSize = nutritionPer100g.servingSize;
  }
  if (nutritionPer100g.servingAmount != null) {
    result.servingAmount = nutritionPer100g.servingAmount;
  }
  if (nutritionPer100g.unit != null) {
    result.unit = nutritionPer100g.unit;
  }
  return result;
}

/**
 * Sums two nutrition facts objects field-by-field.
 * @param {Object} a - First nutrition facts object
 * @param {Object} b - Second nutrition facts object
 * @returns {Object} Summed nutrition facts
 */
export function sumNutrition(a, b) {
  const result = {};
  for (const field of STANDARD_FIELDS) {
    result[field] = (a[field] || 0) + (b[field] || 0);
  }
  // Merge customFields
  const aCustom = a.customFields || {};
  const bCustom = b.customFields || {};
  const mergedCustom = { ...aCustom, ...bCustom };
  // Sum numeric values where both have the same key
  for (const key of Object.keys(aCustom)) {
    if (key in bCustom && typeof aCustom[key] === 'number' && typeof bCustom[key] === 'number') {
      mergedCustom[key] = aCustom[key] + bCustom[key];
    }
  }
  if (Object.keys(mergedCustom).length > 0) {
    result.customFields = mergedCustom;
  }
  return result;
}

/**
 * Calculates the total nutrition for a meal's food items.
 * @param {Array} foodItems - Array of food item objects with a `nutrition` property
 * @returns {Object} Total nutrition facts
 */
export function calculateMealTotal(foodItems) {
  if (foodItems.length === 0) {
    const zero = {};
    for (const field of STANDARD_FIELDS) {
      zero[field] = 0;
    }
    return zero;
  }
  let total = { ...foodItems[0].nutrition };
  for (let i = 1; i < foodItems.length; i++) {
    total = sumNutrition(total, foodItems[i].nutrition);
  }
  return total;
}

/**
 * Adds a custom field to a nutrition facts object.
 * @param {Object} nutrition - Nutrition facts object
 * @param {string} field - Custom field name
 * @param {number} value - Custom field value
 * @returns {Object} New nutrition facts object with the custom field
 */
export function addCustomField(nutrition, field, value) {
  const result = { ...nutrition };
  if (!result.customFields) {
    result.customFields = {};
  }
  result.customFields[field] = value;
  return result;
}