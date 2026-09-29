// In-memory store for products, meals, and OCR config
const products = new Map();
const meals = new Map();
let ocrConfig = null;

function saveProduct(product) {
  products.set(product.id, product);
  return Promise.resolve();
}

function getProduct(id) {
  const product = products.get(id);
  return Promise.resolve(product || null);
}

function getAllProducts() {
  return Promise.resolve(Array.from(products.values()));
}

function deleteProduct(id) {
  products.delete(id);
  return Promise.resolve();
}

function saveMeal(meal) {
  meals.set(meal.id, meal);
  return Promise.resolve();
}

function getMeal(id) {
  const meal = meals.get(id);
  return Promise.resolve(meal || null);
}

function getMealsByDate(date) {
  return Promise.resolve(
    Array.from(meals.values()).filter((m) => m.date === date)
  );
}

function getAllMeals() {
  return Promise.resolve(Array.from(meals.values()));
}

function deleteMeal(id) {
  meals.delete(id);
  return Promise.resolve();
}

function getDailyLog(date) {
  const dayMeals = Array.from(meals.values()).filter((m) => m.date === date);
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
  for (const meal of dayMeals) {
    if (meal.totalNutrition) {
      for (const key of Object.keys(total)) {
        total[key] += meal.totalNutrition[key] || 0;
      }
    }
  }
  return Promise.resolve(total);
}

function saveOcrConfig(config) {
  ocrConfig = config;
  return Promise.resolve();
}

function getOcrConfig() {
  return Promise.resolve(ocrConfig);
}

export {
  saveProduct,
  getProduct,
  getAllProducts,
  deleteProduct,
  saveMeal,
  getMeal,
  getMealsByDate,
  getAllMeals,
  deleteMeal,
  getDailyLog,
  saveOcrConfig,
  getOcrConfig,
};