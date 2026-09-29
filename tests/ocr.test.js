import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractNutritionFromImage, configureOcrEndpoint, getOcrConfig } from "../src/ocr.js";

describe("OCR Module", () => {
  describe("extractNutritionFromImage", () => {
    test("AC-1: Extracts nutrition from chocolate product (Dr. Schär)", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("schär_chocolate_image");
      assert.equal(result.success, true);
      assert.equal(result.confidence, 0.92);
      assert.equal(result.detectedLanguage, "de");
      assert.ok(result.product);
      assert.equal(result.product.name, "Barra de chocolate con leche sin gluten");
      assert.equal(result.product.brand, "Dr. Schär AG/SPA");
      assert.equal(result.product.nutritionPer100g.energyKj, 2292);
      assert.equal(result.product.nutritionPer100g.energyKcal, 549);
      assert.equal(result.product.nutritionPer100g.fat, 33);
      assert.equal(result.product.nutritionPer100g.saturatedFat, 13);
      assert.equal(result.product.nutritionPer100g.carbohydrates, 55);
      assert.equal(result.product.nutritionPer100g.sugars, 45);
      assert.equal(result.product.nutritionPer100g.fiber, 2.4);
      assert.equal(result.product.nutritionPer100g.protein, 6.8);
      assert.equal(result.product.nutritionPer100g.salt, 0.18);
      assert.equal(result.product.servingSize, "30 g = 1 Melto");
      assert.equal(result.product.servingAmount, 30);
      assert.equal(result.product.unit, "g");
      assert.ok(result.product.ingredients);
      assert.deepEqual(result.product.allergens, ["leche", "soja", "nueces", "arachides", "gluten"]);
      assert.ok(result.rawText);
    });

    test("AC-1: Extracts nutrition from juice product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("jugo_appel_image");
      assert.equal(result.success, true);
      assert.equal(result.confidence, 0.88);
      assert.equal(result.detectedLanguage, "nl");
      assert.ok(result.product);
      assert.equal(result.product.name, "Versgeperst Appel-Sinaasappel- en Mangosap");
      assert.equal(result.product.nutritionPer100g.energyKj, 199);
      assert.equal(result.product.nutritionPer100g.energyKcal, 47);
      assert.equal(result.product.nutritionPer100g.fat, 0);
      assert.equal(result.product.nutritionPer100g.saturatedFat, 0);
      assert.equal(result.product.nutritionPer100g.carbohydrates, 11);
      assert.equal(result.product.nutritionPer100g.sugars, 10);
      assert.equal(result.product.nutritionPer100g.fiber, 0.7);
      assert.equal(result.product.nutritionPer100g.protein, 0.4);
      assert.equal(result.product.nutritionPer100g.salt, 0);
      assert.equal(result.product.servingSize, "200 ml");
      assert.equal(result.product.servingAmount, 200);
      assert.equal(result.product.unit, "ml");
      assert.deepEqual(result.product.allergens, []);
    });

    test("AC-1: Extracts nutrition from olive oil product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("aceite_oliva_image");
      assert.equal(result.success, true);
      assert.equal(result.confidence, 0.85);
      assert.equal(result.detectedLanguage, "nl");
      assert.ok(result.product);
      assert.equal(result.product.name, "Extra Olijfolie van de Eerste Persing");
      assert.equal(result.product.nutritionPer100g.energyKj, 3404);
      assert.equal(result.product.nutritionPer100g.energyKcal, 828);
      assert.equal(result.product.nutritionPer100g.fat, 92);
      assert.equal(result.product.nutritionPer100g.saturatedFat, 14);
      assert.equal(result.product.nutritionPer100g.carbohydrates, 0);
      assert.equal(result.product.nutritionPer100g.sugars, 0);
      assert.equal(result.product.nutritionPer100g.fiber, 0);
      assert.equal(result.product.nutritionPer100g.protein, 0);
      assert.equal(result.product.nutritionPer100g.salt, 0);
      assert.deepEqual(result.product.nutritionPer100g.customFields, { vitaminE: 18 });
      assert.equal(result.product.servingSize, "200 ml");
      assert.equal(result.product.servingAmount, 200);
      assert.equal(result.product.unit, "ml");
      assert.deepEqual(result.product.allergens, []);
    });

    test("Returns failure for unrecognized image", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("unknown_image");
      assert.equal(result.success, false);
      assert.ok(result.error);
      assert.equal(result.confidence, 0);
      assert.equal(result.product, undefined);
    });

    test("Throws when no OCR config is set", async () => {
      configureOcrEndpoint(null);
      await assert.rejects(
        extractNutritionFromImage("any_image"),
        { message: "No OCR endpoint configured. Call configureOcrEndpoint first." }
      );
    });
  });

  describe("configureOcrEndpoint", () => {
    test("AC-7: Configures OCR endpoint with URL, key, and model", () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const config = getOcrConfig();
      assert.equal(config.url, "https://api.openai.com/v1");
      assert.equal(config.key, "sk-test-key-123");
      assert.equal(config.model, "gpt-4-vision-preview");
    });

    test("getOcrConfig returns null when not configured", () => {
      configureOcrEndpoint(null);
      const config = getOcrConfig();
      assert.equal(config, null);
    });

    test("AC-7: Can update OCR endpoint configuration", () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      configureOcrEndpoint({
        url: "https://api.anthropic.com/v1",
        key: "sk-new-key-456",
        model: "claude-3-opus",
      });
      const config = getOcrConfig();
      assert.equal(config.url, "https://api.anthropic.com/v1");
      assert.equal(config.key, "sk-new-key-456");
      assert.equal(config.model, "claude-3-opus");
    });
  });

  describe("AC-2: Multilingual Support", () => {
    test("Detects German language from chocolate product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("schär_chocolate_image");
      assert.equal(result.detectedLanguage, "de");
    });

    test("Detects Dutch language from juice product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("jugo_appel_image");
      assert.equal(result.detectedLanguage, "nl");
    });

    test("Detects Dutch language from olive oil product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("aceite_oliva_image");
      assert.equal(result.detectedLanguage, "nl");
    });
  });

  describe("AC-10: Allergen Detection", () => {
    test("Detects allergens in chocolate product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("schär_chocolate_image");
      assert.deepEqual(result.product.allergens, ["leche", "soja", "nueces", "arachides", "gluten"]);
    });

    test("No allergens in juice product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("jugo_appel_image");
      assert.deepEqual(result.product.allergens, []);
    });

    test("No allergens in olive oil product", async () => {
      configureOcrEndpoint({
        url: "https://api.openai.com/v1",
        key: "sk-test-key-123",
        model: "gpt-4-vision-preview",
      });
      const result = await extractNutritionFromImage("aceite_oliva_image");
      assert.deepEqual(result.product.allergens, []);
    });
  });
});