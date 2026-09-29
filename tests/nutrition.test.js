import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNutritionForAmount,
  calculateMealTotal,
  sumNutrition,
  addCustomField,
} from "../src/nutrition.js";

describe("nutrition module", () => {
  describe("calculateNutritionForAmount", () => {
    test("AC-3: scales 45g of chocolate (549 kcal/100g) → 247.05 kcal", () => {
      const per100g = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      };
      const result = calculateNutritionForAmount(per100g, 45);
      assert.strictEqual(result.energyKcal, 247.05);
      assert.strictEqual(result.energyKj, 1031.4);
      assert.strictEqual(result.fat, 14.85);
      assert.strictEqual(result.saturatedFat, 5.85);
      assert.strictEqual(result.carbohydrates, 24.75);
      assert.strictEqual(result.sugars, 20.25);
      assert.strictEqual(result.fiber, 1.08);
      assert.strictEqual(result.protein, 3.06);
      assert.strictEqual(result.salt, 0.081);
    });

    test("AC-3: scales 200ml of juice (47 kcal/100ml) → 94 kcal", () => {
      const per100g = {
        energyKj: 199,
        energyKcal: 47,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 11,
        sugars: 10,
        fiber: 0.7,
        protein: 0.4,
        salt: 0,
      };
      const result = calculateNutritionForAmount(per100g, 200);
      assert.strictEqual(result.energyKcal, 94);
      assert.strictEqual(result.energyKj, 398);
      assert.strictEqual(result.fat, 0);
      assert.strictEqual(result.carbohydrates, 22);
      assert.strictEqual(result.sugars, 20);
      assert.strictEqual(result.fiber, 1.4);
      assert.strictEqual(result.protein, 0.8);
      assert.strictEqual(result.salt, 0);
    });

    test("scales 100g → same values", () => {
      const per100g = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      };
      const result = calculateNutritionForAmount(per100g, 100);
      assert.strictEqual(result.energyKj, 2292);
      assert.strictEqual(result.energyKcal, 549);
      assert.strictEqual(result.fat, 33);
    });

    test("handles 0g → all zeros", () => {
      const per100g = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      };
      const result = calculateNutritionForAmount(per100g, 0);
      assert.strictEqual(result.energyKj, 0);
      assert.strictEqual(result.energyKcal, 0);
      assert.strictEqual(result.fat, 0);
    });

    test("preserves customFields from source", () => {
      const per100g = {
        energyKj: 3404,
        energyKcal: 828,
        fat: 92,
        saturatedFat: 14,
        carbohydrates: 0,
        sugars: 0,
        fiber: 0,
        protein: 0,
        salt: 0,
        customFields: { vitaminE: 18 },
      };
      const result = calculateNutritionForAmount(per100g, 100);
      assert.deepStrictEqual(result.customFields, { vitaminE: 18 });
    });

    test("preserves servingSize and unit", () => {
      const per100g = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
        servingSize: "30 g = 1 Melto",
        servingAmount: 30,
        unit: "g",
      };
      const result = calculateNutritionForAmount(per100g, 45);
      assert.strictEqual(result.servingSize, "30 g = 1 Melto");
      assert.strictEqual(result.servingAmount, 30);
      assert.strictEqual(result.unit, "g");
    });
  });

  describe("calculateMealTotal", () => {
    test("AC-4: sums chocolate (45g, 247.05 kcal) + juice (200ml, 94 kcal) → 341.05 kcal", () => {
      const foodItems = [
        {
          id: "item1",
          productId: "choc1",
          productName: "Chocolate sin gluten - 45g",
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
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "item2",
          productId: "juice1",
          productName: "Jugo de frutas - 200ml",
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
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];
      const result = calculateMealTotal(foodItems);
      assert.strictEqual(result.energyKcal, 341.05);
      assert.strictEqual(result.energyKj, 1429.4);
      assert.strictEqual(result.fat, 14.85);
      assert.strictEqual(result.saturatedFat, 5.85);
      assert.strictEqual(result.carbohydrates, 46.75);
      assert.strictEqual(result.sugars, 40.25);
      assert.strictEqual(result.fiber, 2.48);
      assert.strictEqual(result.protein, 3.86);
      assert.strictEqual(result.salt, 0.081);
    });

    test("empty array → all zeros", () => {
      const result = calculateMealTotal([]);
      assert.strictEqual(result.energyKj, 0);
      assert.strictEqual(result.energyKcal, 0);
      assert.strictEqual(result.fat, 0);
      assert.strictEqual(result.carbohydrates, 0);
      assert.strictEqual(result.protein, 0);
      assert.strictEqual(result.salt, 0);
    });

    test("single item returns that item's nutrition", () => {
      const foodItems = [
        {
          id: "item1",
          productId: "choc1",
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
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];
      const result = calculateMealTotal(foodItems);
      assert.strictEqual(result.energyKcal, 247.05);
      assert.strictEqual(result.energyKj, 1031.4);
    });

    test("sums customFields from all items", () => {
      const foodItems = [
        {
          id: "item1",
          productId: "oil1",
          productName: "Aceite de oliva - 20g",
          grams: 20,
          nutrition: {
            energyKj: 680.8,
            energyKcal: 165.6,
            fat: 18.4,
            saturatedFat: 2.8,
            carbohydrates: 0,
            sugars: 0,
            fiber: 0,
            protein: 0,
            salt: 0,
            customFields: { vitaminE: 3.6 },
          },
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "item2",
          productId: "oil2",
          productName: "Aceite de oliva - 30g",
          grams: 30,
          nutrition: {
            energyKj: 1021.2,
            energyKcal: 248.4,
            fat: 27.6,
            saturatedFat: 4.2,
            carbohydrates: 0,
            sugars: 0,
            fiber: 0,
            protein: 0,
            salt: 0,
            customFields: { vitaminE: 5.4 },
          },
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];
      const result = calculateMealTotal(foodItems);
      assert.strictEqual(result.customFields.vitaminE, 9);
    });
  });

  describe("sumNutrition", () => {
    test("AC-6: sums two nutrition facts objects", () => {
      const a = {
        energyKj: 1031.4,
        energyKcal: 247.05,
        fat: 14.85,
        saturatedFat: 5.85,
        carbohydrates: 24.75,
        sugars: 20.25,
        fiber: 1.08,
        protein: 3.06,
        salt: 0.081,
      };
      const b = {
        energyKj: 398,
        energyKcal: 94,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 22,
        sugars: 20,
        fiber: 1.4,
        protein: 0.8,
        salt: 0,
      };
      const result = sumNutrition(a, b);
      assert.strictEqual(result.energyKj, 1429.4);
      assert.strictEqual(result.energyKcal, 341.05);
      assert.strictEqual(result.fat, 14.85);
      assert.strictEqual(result.carbohydrates, 46.75);
      assert.strictEqual(result.sugars, 40.25);
      assert.strictEqual(result.fiber, 2.48);
      assert.strictEqual(result.protein, 3.86);
      assert.strictEqual(result.salt, 0.081);
    });

    test("sums customFields", () => {
      const a = {
        energyKj: 100,
        energyKcal: 50,
        fat: 5,
        saturatedFat: 2,
        carbohydrates: 10,
        sugars: 5,
        fiber: 1,
        protein: 3,
        salt: 0.1,
        customFields: { sodium: 100, vitaminC: 10 },
      };
      const b = {
        energyKj: 200,
        energyKcal: 100,
        fat: 10,
        saturatedFat: 5,
        carbohydrates: 20,
        sugars: 10,
        fiber: 2,
        protein: 6,
        salt: 0.2,
        customFields: { sodium: 200, vitaminD: 5 },
      };
      const result = sumNutrition(a, b);
      assert.strictEqual(result.customFields.sodium, 300);
      assert.strictEqual(result.customFields.vitaminC, 10);
      assert.strictEqual(result.customFields.vitaminD, 5);
    });

    test("handles missing customFields", () => {
      const a = {
        energyKj: 100,
        energyKcal: 50,
        fat: 5,
        saturatedFat: 2,
        carbohydrates: 10,
        sugars: 5,
        fiber: 1,
        protein: 3,
        salt: 0.1,
      };
      const b = {
        energyKj: 200,
        energyKcal: 100,
        fat: 10,
        saturatedFat: 5,
        carbohydrates: 20,
        sugars: 10,
        fiber: 2,
        protein: 6,
        salt: 0.2,
        customFields: { sodium: 100 },
      };
      const result = sumNutrition(a, b);
      assert.deepStrictEqual(result.customFields, { sodium: 100 });
    });

    test("handles both with no customFields", () => {
      const a = {
        energyKj: 100,
        energyKcal: 50,
        fat: 5,
        saturatedFat: 2,
        carbohydrates: 10,
        sugars: 5,
        fiber: 1,
        protein: 3,
        salt: 0.1,
      };
      const b = {
        energyKj: 200,
        energyKcal: 100,
        fat: 10,
        saturatedFat: 5,
        carbohydrates: 20,
        sugars: 10,
        fiber: 2,
        protein: 6,
        salt: 0.2,
      };
      const result = sumNutrition(a, b);
      assert.strictEqual(result.customFields, undefined);
    });
  });

  describe("addCustomField", () => {
    test("AC-5: adds a custom field to nutrition", () => {
      const nutrition = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      };
      const result = addCustomField(nutrition, "sodium", 0.07);
      assert.strictEqual(result.customFields.sodium, 0.07);
      assert.strictEqual(result.energyKcal, 549);
    });

    test("adds multiple custom fields", () => {
      const nutrition = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      };
      const result = addCustomField(addCustomField(nutrition, "sodium", 0.07), "vitaminC", 26);
      assert.strictEqual(result.customFields.sodium, 0.07);
      assert.strictEqual(result.customFields.vitaminC, 26);
    });

    test("overwrites existing custom field", () => {
      const nutrition = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
        customFields: { sodium: 0.05 },
      };
      const result = addCustomField(nutrition, "sodium", 0.07);
      assert.strictEqual(result.customFields.sodium, 0.07);
    });

    test("preserves existing customFields when adding new one", () => {
      const nutrition = {
        energyKj: 2292,
        energyKcal: 549,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
        customFields: { vitaminC: 10 },
      };
      const result = addCustomField(nutrition, "sodium", 0.07);
      assert.strictEqual(result.customFields.vitaminC, 10);
      assert.strictEqual(result.customFields.sodium, 0.07);
    });
  });
});