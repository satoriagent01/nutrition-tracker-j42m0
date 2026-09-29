/**
 * Storage module using localStorage for persistence.
 * All functions are async to match the test expectations.
 */

const PRODUCTS_KEY = 'nutrition_tracker_products';
const MEALS_KEY = 'nutrition_tracker_meals';
const OCR_CONFIG_KEY = 'nutrition_tracker_ocr_config';

/**
 * Parse a JSON value from localStorage, returning null on failure.
 */
function parseStorage(key) {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save a JSON value to localStorage.
 */
function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Save a product.
 * @param {Object} product - Product object
 * @returns {Promise<void>}
 */
export async function saveProduct(product) {
  const products = parseStorage(PRODUCTS_KEY) || [];
  const existingIndex = products.findIndex(p => p.id === product.id);
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  saveStorage(PRODUCTS_KEY, products);
}

/**
 * Get a product by ID.
 * @param {string} id - Product ID
 * @returns {Promise<Object|null>}
 */
export async function getProduct(id) {
  const products = parseStorage(PRODUCTS_KEY) || [];
  const product = products.find(p => p.id === id);
  return product || null;
}

/**
 * Get all products.
 * @returns {Promise<Array>}
 */
export async function getAllProducts() {
  const products = parseStorage(PRODUCTS_KEY) || [];
  return products;
}

/**
 * Delete a product by ID.
 * @param {string} id - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  const products = parseStorage(PRODUCTS_KEY) || [];
  const filtered = products.filter(p => p.id !== id);
  saveStorage(PRODUCTS_KEY, filtered);
}

/**
 * Save a meal.
 * @param {Object} meal - Meal object
 * @returns {Promise<void>}
 */
export async function saveMeal(meal) {
  const meals = parseStorage(MEALS_KEY) || [];
  const existingIndex = meals.findIndex(m => m.id === meal.id);
  if (existingIndex >= 0) {
    meals[existingIndex] = meal;
  } else {
    meals.push(meal);
  }
  saveStorage(MEALS_KEY, meals);
}

/**
 * Get a meal by ID.
 * @param {string} id - Meal ID
 * @returns {Promise<Object|null>}
 */
export async function getMeal(id) {
  const meals = parseStorage(MEALS_KEY) || [];
  const meal = meals.find(m => m.id === id);
  return meal || null;
}

/**
 * Get meals by date.
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function getMealsByDate(date) {
  const meals = parseStorage(MEALS_KEY) || [];
  return meals.filter(m => m.date === date);
}

/**
 * Get all meals.
 * @returns {Promise<Array>}
 */
export async function getAllMeals() {
  const meals = parseStorage(MEALS_KEY) || [];
  return meals;
}

/**
 * Delete a meal by ID.
 * @param {string} id - Meal ID
 * @returns {Promise<void>}
 */
export async function deleteMeal(id) {
  const meals = parseStorage(MEALS_KEY) || [];
  const filtered = meals.filter(m => m.id !== id);
  saveStorage(MEALS_KEY, filtered);
}

/**
 * Get daily log for a date - returns meals and total nutrition.
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function getDailyLog(date) {
  const meals = parseStorage(MEALS_KEY) || [];
  const dayMeals = meals.filter(m => m.date === date);

  const totalNutrition = {
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

  for (const meal of dayMeals) {
    const total = meal.totalNutrition;
    if (total) {
      totalNutrition.energyKj += total.energyKj || 0;
      totalNutrition.energyKcal += total.energyKcal || 0;
      totalNutrition.fat += total.fat || 0;
      totalNutrition.saturatedFat += total.saturatedFat || 0;
      totalNutrition.carbohydrates += total.carbohydrates || 0;
      totalNutrition.sugars += total.sugars || 0;
      totalNutrition.fiber += total.fiber || 0;
      totalNutrition.protein += total.protein || 0;
      totalNutrition.salt += total.salt || 0;
    }
  }

  return {
    date,
    meals: dayMeals,
    totalNutrition,
  };
}

/**
 * Save OCR configuration.
 * @param {Object} config - OCR config object with url, key, model
 * @returns {Promise<void>}
 */
export async function saveOcrConfig(config) {
  saveStorage(OCR_CONFIG_KEY, config);
}

/**
 * Get OCR configuration.
 * @returns {Promise<Object|null>}
 */
export async function getOcrConfig() {
  return parseStorage(OCR_CONFIG_KEY);
}