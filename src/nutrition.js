/**
 * Nutrition calculation module.
 * Pure functions for scaling nutrition facts and summing them.
 */

/**
 * Scales nutrition facts from per-100g to a given amount in grams.
 * @param {Object} nutritionPer100g - Nutrition facts per 100g
 * @param {number} amountGrams - Amount in grams
 * @returns {Object} Scaled nutrition facts
 */
export function calculateNutritionForAmount(nutritionPer100g, amountGrams) {
  const factor = amountGrams / 100;
  const result = {
    energyKj: nutritionPer100g.energyKj * factor,
    energyKcal: nutritionPer100g.energyKcal * factor,
    fat: nutritionPer100g.fat * factor,
    saturatedFat: nutritionPer100g.saturatedFat * factor,
    carbohydrates: nutritionPer100g.carbohydrates * factor,
    sugars: nutritionPer100g.sugars * factor,
    fiber: nutritionPer100g.fiber * factor,
    protein: nutritionPer100g.protein * factor,
    salt: nutritionPer100g.salt * factor,
  };
  // Preserve custom fields if present
  if (nutritionPer100g.customFields) {
    result.customFields = { ...nutritionPer100g.customFields };
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
  const result = {
    energyKj: (a.energyKj || 0) + (b.energyKj || 0),
    energyKcal: (a.energyKcal || 0) + (b.energyKcal || 0),
    fat: (a.fat || 0) + (b.fat || 0),
    saturatedFat: (a.saturatedFat || 0) + (b.saturatedFat || 0),
    carbohydrates: (a.carbohydrates || 0) + (b.carbohydrates || 0),
    sugars: (a.sugars || 0) + (b.sugars || 0),
    fiber: (a.fiber || 0) + (b.fiber || 0),
    protein: (a.protein || 0) + (b.protein || 0),
    salt: (a.salt || 0) + (b.salt || 0),
  };
  // Merge custom fields
  const customFields = {};
  if (a.customFields) {
    Object.assign(customFields, a.customFields);
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
  let total = {
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
  const result = {
    energyKj: nutrition.energyKj || 0,
    energyKcal: nutrition.energyKcal || 0,
    fat: nutrition.fat || 0,
    saturatedFat: nutrition.saturatedFat || 0,
    carbohydrates: nutrition.carbohydrates || 0,
    sugars: nutrition.sugars || 0,
    fiber: nutrition.fiber || 0,
    protein: nutrition.protein || 0,
    salt: nutrition.salt || 0,
  };
  // Preserve existing custom fields
  if (nutrition.customFields) {
    result.customFields = { ...nutrition.customFields };
  } else {
    result.customFields = {};
  }
  result.customFields[field] = value;
  return result;
}