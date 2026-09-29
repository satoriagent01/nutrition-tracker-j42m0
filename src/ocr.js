/**
 * OCR module — simulates AI-powered nutrition extraction from product images.
 * In production this would call an OpenAI-compatible endpoint.
 */

let _config = null;

/**
 * @typedef {Object} OcrConfig
 * @property {string} url
 * @property {string} key
 * @property {string} model
 */

/**
 * Configure the OCR endpoint.
 * @param {OcrConfig | null} config
 */
export function configureOcrEndpoint(config) {
  _config = config;
}

/**
 * @returns {OcrConfig | null}
 */
export function getOcrConfig() {
  return _config;
}

/**
 * Simulated OCR extraction. In production this calls the configured endpoint.
 * @param {string} imageData — identifier or description of the image
 * @returns {Promise<{ success: boolean, confidence: number, detectedLanguage?: string, product?: Object, error?: string, rawText?: string }>}
 */
export async function extractNutritionFromImage(imageData) {
  if (!_config) {
    throw new Error("No OCR endpoint configured. Call configureOcrEndpoint first.");
  }

  // Simulated extraction based on known test images
  if (imageData.includes("schär")) {
    return {
      success: true,
      confidence: 0.92,
      detectedLanguage: "de",
      product: {
        name: "Barra de chocolate con leche sin gluten",
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
        servingSize: "30 g = 1 Melto",
        servingAmount: 30,
        unit: "g",
        ingredients:
          "pasta de nueces 57% (azúcar, aceites vegetales (palma, girasol), nueces 20%), lactosa (leche), azúcar de caña*, emulsionante: lecitina de soja*, aroma natural de vainilla), glaseado sin gluten (harina de arroz, almidón de maíz, aceite de palma, emulsionante: lecitina de girasol), chocolate con leche 23% (azúcar, mantequilla de cacao*, leche entera en polvo, chocolate negro 7.5% (pasta de cacao*, azúcar, mantequilla de cacao*), emulsionante: lecitina de soja; aroma natural de vainilla), polvo de levadura: carbonato de sodio, carbonato de amonio",
        allergens: ["leche", "soja", "nueces", "arachides", "gluten"],
      },
      rawText: "Nährwertdeklaration / Déclaration nutritionnelle / ...",
    };
  }

  if (imageData.includes("jugo") || imageData.includes("appel")) {
    return {
      success: true,
      confidence: 0.88,
      detectedLanguage: "nl",
      product: {
        name: "Versgeperst Appel-Sinaasappel- en Mangosap",
        nutritionPer100g: {
          energyKj: 199,
          energyKcal: 47,
          fat: 0,
          saturatedFat: 0,
          carbohydrates: 11,
          sugars: 10,
          fiber: 0.7,
          protein: 0.4,
          salt: 0,
        },
        servingSize: "200 ml",
        servingAmount: 200,
        unit: "ml",
        ingredients:
          "45% appel, 35% sinaasappel, 20% mango, antioxidant (ascorbinezuur [E300])",
        allergens: [],
      },
      rawText: "Voedingswaarde per 100 ml / glas (200 ml) / ...",
    };
  }

  if (imageData.includes("aceite") || imageData.includes("oliva")) {
    return {
      success: true,
      confidence: 0.85,
      detectedLanguage: "nl",
      product: {
        name: "Extra Olijfolie van de Eerste Persing",
        nutritionPer100g: {
          energyKj: 3404,
          energyKcal: 828,
          fat: 92,
          saturatedFat: 14,
          carbohydrates: 0,
          sugars: 0,
          fiber: 0,
          protein: 0,
          salt: 0,
          customFields: {
            vitaminE: 18,
          },
        },
        servingSize: "200 ml",
        servingAmount: 200,
        unit: "ml",
        ingredients: "extra vierge olijfolie",
        allergens: [],
      },
      rawText: "Voedingswaarde per 100 ml / ...",
    };
  }

  // Unknown image — return failure
  return {
    success: false,
    error: "No se pudo extraer información nutricional de la imagen.",
    confidence: 0,
  };
}