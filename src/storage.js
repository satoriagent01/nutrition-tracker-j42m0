/**
 * Storage module for nutrition tracker.
 * Uses an in-memory store by default (works in Node.js tests),
 * and falls back to localStorage when available (browser).
 */

// In-memory store (default)
let _store = {};

// Try to use localStorage if available
let _useLocalStorage = false;
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    _useLocalStorage = true;
  }
} catch (e) {
  // localStorage not available, use in-memory store
}

/**
 * Read all data from the store.
 */
function readStore() {
  if (_useLocalStorage) {
    const data = localStorage.getItem('nutrition-tracker');
    return data ? JSON.parse(data) : {};
  }
  return _store;
}

/**
 * Write all data to the store.
 */
function writeStore(data) {
  if (_useLocalStorage) {
    localStorage.setItem('nutrition-tracker', JSON.stringify(data));
  } else {
    _store = data;
  }
}

/**
 * Save a product.
 * @param {Object} product - Product object
 */
export async function saveProduct(product) {
  const data = readStore();
  data.products = data.products || {};
  data.products[product.id] = product;
  writeStore(data);
}

/**
 * Get a product by ID.
 * @param {string} id - Product ID
 * @returns {Object|null} Product or null
 */
export async function getProduct(id) {
  const data = readStore();
  return data.products && data.products[id] ? data.products[id] : null;
}

/**
 * Get all products.
 * @returns {Array} Array of products
 */
export async function getAllProducts() {
  const data = readStore();
  return data.products ? Object.values(data.products) : [];
}

/**
 * Delete a product by ID.
 * @param {string} id - Product ID
 */
export async function deleteProduct(id) {
  const data = readStore();
  if (data.products && data.products[id]) {
    delete data.products[id];
    writeStore(data);
  }
}

/**
 * Save a meal.
 * @param {Object} meal - Meal object
 */
export async function saveMeal(meal) {
  const data = readStore();
  data.meals = data.meals || {};
  data.meals[meal.id] = meal;
  writeStore(data);
}

/**
 * Get a meal by ID.
 * @param {string} id - Meal ID
 * @returns {Object|null} Meal or null
 */
export async function getMeal(id) {
  const data = readStore();
  return data.meals && data.meals[id] ? data.meals[id] : null;
}

/**
 * Get meals by date.
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} Array of meals for the date
 */
export async function getMealsByDate(date) {
  const data = readStore();
  if (!data.meals) return [];
  return Object.values(data.meals).filter(m => m.date === date);
}

/**
 * Get all meals.
 * @returns {Array} Array of all meals
 */
export async function getAllMeals() {
  const data = readStore();
  return data.meals ? Object.values(data.meals) : [];
}

/**
 * Delete a meal by ID.
 * @param {string} id - Meal ID
 */
export async function deleteMeal(id) {
  const data = readStore();
  if (data.meals && data.meals[id]) {
    delete data.meals[id];
    writeStore(data);
  }
}

/**
 * Get daily log for a date (all meals + total nutrition).
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Object} Daily log with meals and total nutrition
 */
export async function getDailyLog(date) {
  const meals = await getMealsByDate(date);
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

  for (const meal of meals) {
    if (meal.totalNutrition) {
      for (const key of Object.keys(totalNutrition)) {
        totalNutrition[key] += meal.totalNutrition[key] || 0;
      }
    }
  }

  // Round totals
  for (const key of Object.keys(totalNutrition)) {
    totalNutrition[key] = Math.round(totalNutrition[key] * 1000) / 1000;
  }

  return {
    date,
    meals,
    totalNutrition,
  };
}

/**
 * Save OCR configuration.
 * @param {Object} config - OCR config with url, key, model
 */
export async function saveOcrConfig(config) {
  const data = readStore();
  data.ocrConfig = config;
  writeStore(data);
}

/**
 * Get OCR configuration.
 * @returns {Object|null} OCR config or null
 */
export async function getOcrConfig() {
  const data = readStore();
  return data.ocrConfig || null;
}