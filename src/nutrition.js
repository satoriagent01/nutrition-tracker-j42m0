/**
 * Nutrition calculation module.
 * All functions are pure (no side effects).
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

  // Preserve customFields if present
  if (nutritionPer100g.customFields) {
    result.customFields = { ...nutritionPer100g.customFields };
  }

  // Preserve servingSize, servingAmount, unit if present
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

  let hasCustomFields = false;

  for (const item of foodItems) {
    const n = item.nutrition;
    if (!n) continue;

    total.energyKj += n.energyKj || 0;
    total.energyKcal += n.energyKcal || 0;
    total.fat += n.fat || 0;
    total.saturatedFat += n.saturatedFat || 0;
    total.carbohydrates += n.carbohydrates || 0;
    total.sugars += n.sugars || 0;
    total.fiber += n.fiber || 0;
    total.protein += n.protein || 0;
    total.salt += n.salt || 0;

    if (n.customFields) {
      hasCustomFields = true;
      if (!total.customFields) {
        total.customFields = {};
      }
      for (const [key, value] of Object.entries(n.customFields)) {
        total.customFields[key] = (total.customFields[key] || 0) + value;
      }
    }
  }

  return total;
}

/**
 * Adds two nutrition objects together.
 * @param {Object} a - First nutrition object
 * @param {Object} b - Second nutrition object
 * @returns {Object} Summed nutrition object
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

  // Merge customFields from both objects
  const aCustom = a.customFields || {};
  const bCustom = b.customFields || {};
  const mergedCustom = { ...aCustom, ...bCustom };

  // Sum numeric values for keys present in both
  for (const key of Object.keys(aCustom)) {
    if (bCustom.hasOwnProperty(key)) {
      mergedCustom[key] = aCustom[key] + bCustom[key];
    }
  }

  // Only include customFields if there are any
  if (Object.keys(mergedCustom).length > 0) {
    result.customFields = mergedCustom;
  }

  return result;
}

/**
 * Adds a custom field to a nutrition object.
 * @param {Object} nutrition - Nutrition object
 * @param {string} field - Custom field name
 * @param {number} value - Custom field value
 * @returns {Object} New nutrition object with custom field added
 */
export function addCustomField(nutrition, field, value) {
  const result = {
    energyKj: nutrition.energyKj,
    energyKcal: nutrition.energyKcal,
    fat: nutrition.fat,
    saturatedFat: nutrition.saturatedFat,
    carbohydrates: nutrition.carbohydrates,
    sugars: nutrition.sugars,
    fiber: nutrition.fiber,
    protein: nutrition.protein,
    salt: nutrition.salt,
  };

  // Preserve existing customFields
  if (nutrition.customFields) {
    result.customFields = { ...nutrition.customFields };
  } else {
    result.customFields = {};
  }

  result.customFields[field] = value;

  return result;
}