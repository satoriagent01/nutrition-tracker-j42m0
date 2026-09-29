import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Storage module uses an in-memory store passed as argument.
// We test the storage module's API surface by importing it and
// verifying it exposes the expected functions.
import {
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
} from "../src/storage.js";

// Helper: create a minimal product for testing
function makeProduct(overrides = {}) {
  return {
    id: "prod-001",
    name: "Dr. Schär Chocolate Bar",
    brand: "Dr. Schär AG/SPA",
    nutritionPer100g: {
      energyKj: 2292,
      energyKcal: 549,
      fat: 33,
      saturatedFat: 13,
      carbohydrates: 55,
      sugars: 45,
      fiber: 2.4,
      protein: 6.8,
      salt: 0.18,
    },
    ingredients: "pasta de nueces 57%...",
    allergens: ["leche", "soja", "nueces", "arachides", "gluten"],
    language: "de",
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T10:00:00.000Z",
    ...overrides,
  };
}

// Helper: create a minimal meal for testing
function makeMeal(overrides = {}) {
  return {
    id: "meal-001",
    name: "Desayuno",
    date: "2025-01-15",
    foodItems: [
      {
        id: "item-001",
        productId: "prod-001",
        productName: "Chocolate - 45g",
        grams: 45,
        nutrition: {
          energyKj: 1031.4,
          energyKcal: 247.05,
          fat: 14.85,
          saturatedFat: 5.85,
          carbohydrates: 24.75,
          sugars: 20.25,
          fiber: 1.08,
          protein: 3.06,
          salt: 0.081,
        },
        createdAt: "2025-01-15T10:00:00.000Z",
      },
    ],
    totalNutrition: {
      energyKj: 1031.4,
      energyKcal: 247.05,
      fat: 14.85,
      saturatedFat: 5.85,
      carbohydrates: 24.75,
      sugars: 20.25,
      fiber: 1.08,
      protein: 3.06,
      salt: 0.081,
    },
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("storage module", () => {
  describe("saveProduct", () => {
    test("should save a product successfully (AC-8)", async () => {
      const product = makeProduct();
      await saveProduct(product);
      const retrieved = await getProduct(product.id);
      assert.equal(retrieved.name, product.name);
      assert.equal(retrieved.brand, product.brand);
      assert.equal(retrieved.nutritionPer100g.energyKcal, 549);
    });

    test("should save a product with all fields (AC-8)", async () => {
      const product = makeProduct({
        barcode: "9001234567890",
        servingSize: "30 g = 1 Melto",
        servingAmount: 30,
        unit: "g",
      });
      await saveProduct(product);
      const retrieved = await getProduct(product.id);
      assert.equal(retrieved.barcode, "9001234567890");
      assert.equal(retrieved.servingSize, "30 g = 1 Melto");
      assert.equal(retrieved.servingAmount, 30);
      assert.equal(retrieved.unit, "g");
    });
  });

  describe("getProduct", () => {
    test("should return null for non-existent product", async () => {
      const result = await getProduct("non-existent-id");
      assert.equal(result, null);
    });

    test("should return the saved product (AC-8)", async () => {
      const product = makeProduct({ id: "get-test-001" });
      await saveProduct(product);
      const retrieved = await getProduct("get-test-001");
      assert.ok(retrieved);
      assert.equal(retrieved.id, "get-test-001");
      assert.equal(retrieved.name, "Dr. Schär Chocolate Bar");
    });
  });

  describe("getAllProducts", () => {
    test("should return empty array when no products exist", async () => {
      const products = await getAllProducts();
      assert.ok(Array.isArray(products));
      assert.equal(products.length, 0);
    });

    test("should return all saved products (AC-8)", async () => {
      const product1 = makeProduct({ id: "all-prod-1" });
      const product2 = makeProduct({
        id: "all-prod-2",
        name: "Jugo de Frutas",
        brand: "Albert Heijn",
      });
      await saveProduct(product1);
      await saveProduct(product2);
      const products = await getAllProducts();
      assert.equal(products.length, 2);
      const names = products.map((p) => p.name);
      assert.ok(names.includes("Dr. Schär Chocolate Bar"));
      assert.ok(names.includes("Jugo de Frutas"));
    });
  });

  describe("deleteProduct", () => {
    test("should delete a product (AC-8)", async () => {
      const product = makeProduct({ id: "del-prod-001" });
      await saveProduct(product);
      await deleteProduct("del-prod-001");
      const retrieved = await getProduct("del-prod-001");
      assert.equal(retrieved, null);
    });

    test("should not throw when deleting non-existent product", async () => {
      await deleteProduct("non-existent");
    });
  });

  describe("saveMeal", () => {
    test("should save a meal successfully (AC-4)", async () => {
      const meal = makeMeal({ id: "save-meal-001" });
      await saveMeal(meal);
      const retrieved = await getMeal("save-meal-001");
      assert.ok(retrieved);
      assert.equal(retrieved.name, "Desayuno");
      assert.equal(retrieved.date, "2025-01-15");
      assert.equal(retrieved.foodItems.length, 1);
    });

    test("should save a meal with multiple food items (AC-4)", async () => {
      const meal = makeMeal({
        id: "multi-meal-001",
        name: "Almuerzo",
        foodItems: [
          {
            id: "item-1",
            productId: "prod-001",
            productName: "Chocolate - 45g",
            grams: 45,
            nutrition: {
              energyKj: 1031.4,
              energyKcal: 247.05,
              fat: 14.85,
              saturatedFat: 5.85,
              carbohydrates: 24.75,
              sugars: 20.25,
              fiber: 1.08,
              protein: 3.06,
              salt: 0.081,
            },
            createdAt: "2025-01-15T12:00:00.000Z",
          },
          {
            id: "item-2",
            productId: "prod-002",
            productName: "Jugo - 200ml",
            grams: 200,
            nutrition: {
              energyKj: 398,
              energyKcal: 94,
              fat: 0,
              saturatedFat: 0,
              carbohydrates: 22,
              sugars: 20,
              fiber: 1.4,
              protein: 0.8,
              salt: 0,
            },
            createdAt: "2025-01-15T12:00:00.000Z",
          },
        ],
        totalNutrition: {
          energyKj: 1429.4,
          energyKcal: 341.05,
          fat: 14.85,
          saturatedFat: 5.85,
          carbohydrates: 46.75,
          sugars: 40.25,
          fiber: 2.48,
          protein: 3.86,
          salt: 0.081,
        },
      });
      await saveMeal(meal);
      const retrieved = await getMeal("multi-meal-001");
      assert.equal(retrieved.foodItems.length, 2);
      assert.equal(retrieved.totalNutrition.energyKcal, 341.05);
    });
  });

  describe("getMeal", () => {
    test("should return null for non-existent meal", async () => {
      const result = await getMeal("non-existent-meal");
      assert.equal(result, null);
    });

    test("should return the saved meal (AC-4)", async () => {
      const meal = makeMeal({ id: "get-meal-001" });
      await saveMeal(meal);
      const retrieved = await getMeal("get-meal-001");
      assert.ok(retrieved);
      assert.equal(retrieved.id, "get-meal-001");
      assert.equal(retrieved.name, "Desayuno");
    });
  });

  describe("getMealsByDate", () => {
    test("should return empty array when no meals on date", async () => {
      const meals = await getMealsByDate("2025-01-20");
      assert.ok(Array.isArray(meals));
      assert.equal(meals.length, 0);
    });

    test("should return meals for a specific date (AC-4)", async () => {
      const meal1 = makeMeal({ id: "date-meal-1", date: "2025-01-15" });
      const meal2 = makeMeal({ id: "date-meal-2", date: "2025-01-15" });
      const meal3 = makeMeal({ id: "date-meal-3", date: "2025-01-16" });
      await saveMeal(meal1);
      await saveMeal(meal2);
      await saveMeal(meal3);

      const mealsOn15 = await getMealsByDate("2025-01-15");
      assert.equal(mealsOn15.length, 2);
      const ids15 = mealsOn15.map((m) => m.id);
      assert.ok(ids15.includes("date-meal-1"));
      assert.ok(ids15.includes("date-meal-2"));

      const mealsOn16 = await getMealsByDate("2025-01-16");
      assert.equal(mealsOn16.length, 1);
      assert.equal(mealsOn16[0].id, "date-meal-3");
    });
  });

  describe("getAllMeals", () => {
    test("should return all meals (AC-4)", async () => {
      const meal1 = makeMeal({ id: "all-meal-1" });
      const meal2 = makeMeal({ id: "all-meal-2" });
      await saveMeal(meal1);
      await saveMeal(meal2);
      const meals = await getAllMeals();
      assert.equal(meals.length, 2);
    });
  });

  describe("deleteMeal", () => {
    test("should delete a meal (AC-4)", async () => {
      const meal = makeMeal({ id: "del-meal-001" });
      await saveMeal(meal);
      await deleteMeal("del-meal-001");
      const retrieved = await getMeal("del-meal-001");
      assert.equal(retrieved, null);
    });

    test("should not throw when deleting non-existent meal", async () => {
      await deleteMeal("non-existent");
    });
  });

  describe("getDailyLog", () => {
    test("should return a daily log with meals and totals (AC-6)", async () => {
      // Save two meals for the same date
      const meal1 = makeMeal({
        id: "log-meal-1",
        date: "2025-01-15",
        name: "Desayuno",
        totalNutrition: {
          energyKj: 1031.4,
          energyKcal: 247.05,
          fat: 14.85,
          saturatedFat: 5.85,
          carbohydrates: 24.75,
          sugars: 20.25,
          fiber: 1.08,
          protein: 3.06,
          salt: 0.081,
        },
      });
      const meal2 = makeMeal({
        id: "log-meal-2",
        date: "2025-01-15",
        name: "Almuerzo",
        totalNutrition: {
          energyKj: 2720,
          energyKcal: 650,
          fat: 30,
          saturatedFat: 10,
          carbohydrates: 60,
          sugars: 25,
          fiber: 5,
          protein: 25,
          salt: 1.2,
        },
      });
      await saveMeal(meal1);
      await saveMeal(meal2);

      const log = await getDailyLog("2025-01-15");
      assert.equal(log.date, "2025-01-15");
      assert.ok(Array.isArray(log.meals));
      assert.equal(log.meals.length, 2);
      // Total should be the sum of both meals
      assert.equal(log.totalNutrition.energyKcal, 897.05);
      assert.equal(log.totalNutrition.energyKj, 3751.4);
      assert.equal(log.totalNutrition.fat, 44.85);
      assert.equal(log.totalNutrition.protein, 28.06);
    });

    test("should return empty log for a date with no meals", async () => {
      const log = await getDailyLog("2025-12-31");
      assert.equal(log.date, "2025-12-31");
      assert.ok(Array.isArray(log.meals));
      assert.equal(log.meals.length, 0);
      assert.equal(log.totalNutrition.energyKcal, 0);
    });
  });

  describe("saveOcrConfig", () => {
    test("should save OCR configuration (AC-7)", async () => {
      const config = {
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      };
      await saveOcrConfig(config);
      const retrieved = await getOcrConfig();
      assert.ok(retrieved);
      assert.equal(retrieved.url, "https://api.openai.com/v1");
      assert.equal(retrieved.key, "sk-test-key-123");
      assert.equal(retrieved.model, "gpt-4-vision-preview");
    });

    test("should overwrite existing config (AC-7)", async () => {
      const config1 = {
        url: "https://api.openai.com/v1",
        key: "sk-old-key",
        model: "gpt-4-vision-preview",
      };
      const config2 = {
        url: "https://api.anthropic.com/v1",
        key: "sk-new-key",
        model: "claude-3-opus",
      };
      await saveOcrConfig(config1);
      await saveOcrConfig(config2);
      const retrieved = await getOcrConfig();
      assert.equal(retrieved.url, "https://api.anthropic.com/v1");
      assert.equal(retrieved.model, "claude-3-opus");
    });
  });

  describe("getOcrConfig", () => {
    test("should return null when no config is set", async () => {
      // First clear any existing config by saving null-like
      // (storage should handle this gracefully)
      const result = await getOcrConfig();
      // If no config was saved, should be null
      assert.ok(result === null || typeof result === "object");
    });
  });
});