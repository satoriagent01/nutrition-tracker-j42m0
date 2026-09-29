# Especificación: Nutrition Tracker (NutriTrack)

## Visión General

Aplicación gratuita y sin anuncios para rastrear la nutrición de productos alimenticios. Permite a los usuarios tomar o subir fotos de las tablas nutricionales de los productos, extraer la información mediante OCR con IA, y planificar comidas especificando la cantidad en gramos de cada ingrediente para calcular el total nutricional.

---

## 1. Modelo de Datos

### 1.1 Producto (`Product`)

```typescript
interface Product {
  id: string;                    // UUID
  name: string;                  // Nombre del producto (ej: "Versgeperst Appel-Sinaasappel- en Mangosap")
  brand?: string;                // Marca (ej: "Albert Heijn")
  nutritionPer100g: NutritionFacts; // Valores nutricionales por 100g (o 100ml)
  ingredients?: string;          // Lista de ingredientes (texto original)
  allergens?: string[];          // Lista de alérgenos detectados
  language?: string;             // Idioma detectado del etiquetado (ej: "nl", "de", "fr", "it", "en")
  barcode?: string;              // Código de barras si está disponible
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
}
```

### 1.2 Hechos Nutricionales (`NutritionFacts`)

```typescript
interface NutritionFacts {
  energyKj: number;              // Energía en kJ (ej: 2292)
  energyKcal: number;            // Energía en kcal (ej: 549)
  fat: number;                   // Grasas totales en g (ej: 33)
  saturatedFat: number;          // Grasas saturadas en g (ej: 13)
  carbohydrates: number;         // Carbohidratos en g (ej: 55)
  sugars: number;                // Azúcares en g (ej: 45)
  fiber: number;                 // Fibra en g (ej: 2.4)
  protein: number;               // Proteínas en g (ej: 6.8)
  salt: number;                  // Sal en g (ej: 0.18)
  customFields?: Record<string, number>; // Campos personalizados (ej: { sodium: 0.07, vitaminC: 26 })
  servingSize?: string;          // Tamaño de porción (ej: "30 g = 1 Melto", "200 ml")
  servingAmount?: number;        // Cantidad de la porción en g o ml
  unit?: 'g' | 'ml';            // Unidad de medida
}
```

### 1.3 Ítem de Comida (`FoodItem`)

```typescript
interface FoodItem {
  id: string;                    // UUID
  productId: string;             // Referencia al producto (si es un producto conocido)
  productName: string;           // Nombre descriptivo (ej: "Chocolate sin gluten - 45g")
  grams: number;                 // Cantidad en gramos (ej: 45)
  nutrition: NutritionFacts;     // Nutrición calculada para esa cantidad
  createdAt: string;
}
```

### 1.4 Comida (`Meal`)

```typescript
interface Meal {
  id: string;                    // UUID
  name: string;                  // Nombre de la comida (ej: "Desayuno", "Almuerzo")
  date: string;                  // Fecha (YYYY-MM-DD)
  foodItems: FoodItem[];         // Lista de ítems de comida
  totalNutrition: NutritionFacts; // Nutrición total calculada
  createdAt: string;
  updatedAt: string;
}
```

### 1.5 Registro Diario (`DailyLog`)

```typescript
interface DailyLog {
  date: string;                  // Fecha (YYYY-MM-DD)
  meals: Meal[];
  totalNutrition: NutritionFacts; // Suma de todas las comidas del día
  customTotals?: Record<string, number>; // Totales personalizados
}
```

---

## 2. OCR con IA

### 2.1 Módulo: `ocr`

El módulo de OCR llama a un endpoint OpenAI-compatible configurado por el usuario en la interfaz. **Las pruebas simulan la respuesta de la IA** (no llaman al endpoint real).

#### Funciones exportadas:

**`extractNutritionFromImage(imageData: string): Promise<NutritionExtractionResult>`**

- **Parámetros:**
  - `imageData`: string base64 de la imagen (o URL)
- **Retorna:** `Promise<NutritionExtractionResult>`
- **Async:** Sí

```typescript
interface NutritionExtractionResult {
  success: boolean;
  product?: Product;
  error?: string;
  confidence: number;            // 0.0 a 1.0
  detectedLanguage?: string;
  rawText?: string;              // Texto OCR completo (para verificación)
}
```

**Ejemplo de entrada/salida (basado en imagen 1 - chocolate sin gluten):**

Entrada: imagen base64 del etiquetado del producto Dr. Schär

Salida:
```json
{
  "success": true,
  "confidence": 0.92,
  "detectedLanguage": "de",
  "product": {
    "name": "Barra de chocolate con leche sin gluten",
    "brand": "Dr. Schär AG/SPA",
    "nutritionPer100g": {
      "energyKj": 2292,
      "energyKcal": 549,
      "fat": 33,
      "saturatedFat": 13,
      "carbohydrates": 55,
      "sugars": 45,
      "fiber": 2.4,
      "protein": 6.8,
      "salt": 0.18
    },
    "servingSize": "30 g = 1 Melto",
    "servingAmount": 30,
    "unit": "g",
    "ingredients": "pasta de nueces 57% (azúcar, aceites vegetales (palma, girasol), nueces 20%), lactosa (leche), azúcar de caña*, emulsionante: lecitina de soja*, aroma natural de vainilla), glaseado sin gluten (harina de arroz, almidón de maíz, aceite de palma, emulsionante: lecitina de girasol), chocolate con leche 23% (azúcar, mantequilla de cacao*, leche entera en polvo, chocolate negro 7.5% (pasta de cacao*, azúcar, mantequilla de cacao*), emulsionante: lecitina de soja; aroma natural de vainilla), polvo de levadura: carbonato de sodio, carbonato de amonio",
    "allergens": ["leche", "soja", "nueces", "arachides", "gluten"]
  },
  "rawText": "Nährwertdeklaration / Déclaration nutritionnelle / ..."
}
```

**Ejemplo de entrada/salida (basado en imagen 2 - jugo de frutas):**

Entrada: imagen base64 del etiquetado del jugo

Salida:
```json
{
  "success": true,
  "confidence": 0.88,
  "detectedLanguage": "nl",
  "product": {
    "name": "Versgeperst Appel-Sinaasappel- en Mangosap",
    "nutritionPer100g": {
      "energyKj": 199,
      "energyKcal": 47,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 11,
      "sugars": 10,
      "fiber": 0.7,
      "protein": 0.4,
      "salt": 0
    },
    "servingSize": "200 ml",
    "servingAmount": 200,
    "unit": "ml",
    "ingredients": "45% appel, 35% sinaasappel, 20% mango, antioxidant (ascorbinezuur [E300])",
    "allergens": []
  }
}
```

**Ejemplo de entrada/salida (basado en imagen 3 - aceite de oliva):**

Entrada: imagen base64 del etiquetado del aceite

Salida:
```json
{
  "success": true,
  "confidence": 0.85,
  "detectedLanguage": "nl",
  "product": {
    "name": "Extra Olijfolie van de Eerste Persing",
    "nutritionPer100g": {
      "energyKj": 3404,
      "energyKcal": 828,
      "fat": 92,
      "saturatedFat": 14,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": 0,
      "protein": 0,
      "salt": 0,
      "customFields": {
        "vitaminE": 18
      }
    },
    "servingSize": "200 ml",
    "servingAmount": 200,
    "unit": "ml",
    "ingredients": "extra vierge olijfolie",
    "allergens": []
  }
}
```

**`configureOcrEndpoint(config: OcrConfig): void`**

- **Parámetros:**
  - `config`: `{ url: string; key: string; model: string }`
  - `url`: URL del endpoint OpenAI-compatible (ej: `https://api.openai.com/v1`)
  - `key`: Clave API
  - `model`: Modelo a usar (ej: `gpt-4-vision-preview`, `claude-3-opus`)
- **Retorna:** `void`
- **Async:** No

**`getOcrConfig(): OcrConfig | null`**

- **Retorna:** `OcrConfig | null` — la configuración actual o null si no está configurada.
- **Async:** No

---

## 3. Lógica de Nutrición

### 3.1 Módulo: `nutrition`

#### Funciones exportadas:

**`calculateNutritionForAmount(nutritionPer100g: NutritionFacts, amountGrams: number): NutritionFacts`**

- **Parámetros:**
  - `nutritionPer100g`: los valores nutricionales por 100g/ml del producto
  - `amountGrams`: cantidad en gramos (o ml)
- **Retorna:** `NutritionFacts` — los valores nutricionales escalados a la cantidad dada
- **Async:** No (pura)

**Ejemplo:**
```
Input: { energyKj: 2292, energyKcal: 549, fat: 33, ... }, 45g
Output: { energyKj: 1031.4, energyKcal: 247.05, fat: 14.85, ... }
```

**`calculateMealTotal(foodItems: FoodItem[]): NutritionFacts`**

- **Parámetros:**
  - `foodItems`: array de FoodItem
- **Retorna:** `NutritionFacts` — suma de toda la nutrición de los ítems
- **Async:** No (pura)

**Ejemplo:**
```
Input: [
  { productName: "Chocolate", grams: 45, nutrition: { energyKcal: 247.05, ... } },
  { productName: "Jugo", grams: 200, nutrition: { energyKcal: 94, ... } }
]
Output: { energyKj: 2942.8, energyKcal: 704.05, fat: 14.85, ... }
```

**`addCustomField(nutrition: NutritionFacts, field: string, value: number): NutritionFacts`**

- **Parámetros:**
  - `nutrition`: los hechos nutricionales actuales
  - `field`: nombre del campo personalizado (ej: "sodium", "vitaminC")
  - `value`: valor numérico
- **Retorna:** `NutritionFacts` con el campo custom añadido
- **Async:** No (pura)

**`sumNutrition(a: NutritionFacts, b: NutritionFacts): NutritionFacts`**

- **Parámetros:**
  - `a`, `b`: dos objetos NutritionFacts
- **Retorna:** `NutritionFacts` — suma campo por campo (incluyendo customFields)
- **Async:** No (pura)

---

## 4. Almacenamiento

### 4.1 Módulo: `storage`

#### Funciones exportadas:

**`saveProduct(product: Product): Promise<void>`**
**`getProduct(id: string): Promise<Product | null>`**
**`getAllProducts(): Promise<Product[]>`**
**`deleteProduct(id: string): Promise<void>`**
**`saveMeal(meal: Meal): Promise<void>`**
**`getMeal(id: string): Promise<Meal | null>`**
**`getMealsByDate(date: string): Promise<Meal[]>`**
**`getAllMeals(): Promise<Meal[]>`**
**`deleteMeal(id: string): Promise<void>`**
**`getDailyLog(date: string): Promise<DailyLog>`**
**`saveOcrConfig(config: OcrConfig): Promise<void>`**
**`getOcrConfig(): Promise<OcrConfig | null>`**

- Todas las funciones son asíncronas y operan sobre almacenamiento local (IndexedDB o similar).
- Las pruebas mockean estas funciones.

---

## 5. Interfaz de Usuario (Frontend)

### Pantalla 1: Escáner de Etiquetas (`ScanScreen`)

**Qué hace el usuario:**
1. Selecciona o toma una foto de la tabla nutricional de un producto.
2. La app envía la imagen al OCR con IA.
3. Muestra los datos extraídos para que el usuario los verifique y edite si es necesario.
4. El usuario confirma o corrige los datos.
5. El producto se guarda en la biblioteca.

**Funciones de lógica llamadas:**
- `ocr.extractNutritionFromImage(imageData)` — extrae datos de la imagen
- `storage.saveProduct(product)` — guarda el producto verificado
- `nutrition.calculateNutritionForAmount(...)` — para mostrar valores por porción

### Pantalla 2: Biblioteca de Productos (`LibraryScreen`)

**Qué hace el usuario:**
1. Ve la lista de todos los productos guardados.
2. Puede buscar productos por nombre.
3. Puede ver los detalles de cada producto (nutrición por 100g, ingredientes, alérgenos).
4. Puede eliminar productos.

**Funciones de lógica llamadas:**
- `storage.getAllProducts()` — obtiene todos los productos
- `storage.getProduct(id)` — obtiene detalles de un producto
- `storage.deleteProduct(id)` — elimina un producto

### Pantalla 3: Planificador de Comidas (`MealPlannerScreen`)

**Qué hace el usuario:**
1. Selecciona una fecha.
2. Añade comidas (Desayuno, Almuerzo, Cena, Snack, etc.).
3. Dentro de cada comida, añade ítems de comida:
   - Busca en su biblioteca de productos.
   - Especifica la cantidad en gramos (o ml).
4. La app calcula automáticamente la nutrición total de cada ítem y de la comida completa.
5. Puede ver el resumen nutricional del día.

**Funciones de lógica llamadas:**
- `storage.getAllProducts()` — para buscar productos
- `nutrition.calculateNutritionForAmount(product.nutritionPer100g, grams)` — calcula nutrición del ítem
- `nutrition.calculateMealTotal(foodItems)` — calcula total de la comida
- `storage.saveMeal(meal)` — guarda la comida
- `storage.getMealsByDate(date)` — obtiene comidas de una fecha
- `nutrition.sumNutrition(...)` — suma nutrición de todas las comidas del día

### Pantalla 4: Resumen Diario (`DailySummaryScreen`)

**Qué hace el usuario:**
1. Selecciona una fecha.
2. Ve el resumen nutricional de todas las comidas del día.
3. Puede ver desglose por macronutrientes (energía, grasas, carbohidratos, proteínas, sal).
4. Puede ver totales de campos personalizados (sodio, vitaminas, etc.).
5. Puede añadir campos personalizados para rastrear lo que quiera.

**Funciones de lógica llamadas:**
- `storage.getDailyLog(date)` — obtiene el registro del día
- `nutrition.sumNutrition(...)` — suma totales
- `nutrition.addCustomField(...)` — añade campos personalizados

### Pantalla 5: Configuración (`SettingsScreen`)

**Qué hace el usuario:**
1. Configura el endpoint de OCR con IA:
   - URL del endpoint (ej: `https://api.openai.com/v1`)
   - Clave API
   - Modelo a usar (ej: `gpt-4-vision-preview`)
2. Puede gestionar campos personalizados de nutrición.

**Funciones de lógica llamadas:**
- `ocr.configureOcrEndpoint(config)` — guarda la configuración
- `ocr.getOcrConfig()` — obtiene la configuración actual

---

## 6. Criterios de Aceptación

### AC-1: Extracción OCR de Tablas Nutricionales
- El sistema puede procesar una foto de una tabla nutricional y extraer correctamente los valores de energía (kJ y kcal), grasas, grasas saturadas, carbohidratos, azúcares, fibra, proteínas y sal.
- **Ejemplo:** La imagen 1 (chocolate Dr. Schär) se procesa y se extraen: energía 2292 kJ / 549 kcal, grasas 33g, grasas saturadas 13g, carbohidratos 55g, azúcares 45g, fibra 2.4g, proteínas 6.8g, sal 0.18g.
- **Ejemplo:** La imagen 2 (jugo de frutas) se procesa y se extraen: energía 199 kJ / 47 kcal, grasas 0g, carbohidratos 11g, azúcares 10g, fibra 0.7g, proteínas 0.4g, sal 0g.
- **Ejemplo:** La imagen 3 (aceite de oliva) se procesa y se extraen: energía 3404 kJ / 828 kcal, grasas 92g, grasas saturadas 14g, carbohidratos 0g, azúcares 0g, fibra 0g, proteínas 0g, sal 0g, vitamina E 18mg.

### AC-2: Soporte Multilingüe
- El OCR detecta y maneja tablas nutricionales en múltiples idiomas (alemán, neerlandés, francés, italiano, inglés, español).
- **Ejemplo:** La imagen 1 tiene etiquetas en alemán, francés, neerlandés e italiano. El sistema detecta el idioma principal y extrae los datos correctamente.
- **Ejemplo:** La imagen 2 tiene etiquetas en neerlandés. El sistema detecta "nl" y extrae correctamente.
- **Ejemplo:** La imagen 3 tiene etiquetas en neerlandés. El sistema detecta "nl" y extrae correctamente.

### AC-3: Cálculo Nutricional por Cantidad
- El sistema puede calcular la nutrición para cualquier cantidad en gramos de un producto.
- **Ejemplo:** Si un producto tiene 549 kcal por 100g, 45g del producto equivalen a 247.05 kcal.
- **Ejemplo:** Si un producto tiene 199 kJ / 47 kcal por 100ml, 200ml equivalen a 398 kJ / 94 kcal.

### AC-4: Planificador de Comidas
- El usuario puede crear comidas con múltiples ítems, especificando la cantidad en gramos de cada uno.
- El sistema calcula automáticamente la nutrición total de cada comida.
- **Ejemplo:** Una comida con 45g de chocolate (247.05 kcal) y 200ml de jugo (94 kcal) tiene un total de 341.05 kcal.

### AC-5: Campos Personalizados
- El usuario puede añadir campos personalizados para rastrear cualquier nutriente (sodio, vitaminas, etc.).
- **Ejemplo:** El aceite de oliva tiene vitamina E 150% de la referencia diaria por 100ml. El usuario puede añadir "vitaminaE" como campo personalizado.
- **Ejemplo:** El usuario puede rastrear sodio, calcio, hierro, o cualquier otro nutriente que no esté en los campos estándar.

### AC-6: Resumen Diario
- El sistema suma la nutrición de todas las comidas del día para dar un resumen completo.
- **Ejemplo:** Si el usuario tiene 3 comidas en un día con 341.05, 650 y 520 kcal respectivamente, el resumen muestra 1511.05 kcal totales.

### AC-7: Configuración del Endpoint OCR
- El usuario puede configurar su propio endpoint OpenAI-compatible con URL, clave y modelo.
- La configuración se guarda y se usa para todas las extracciones OCR.
- Las pruebas nunca llaman al endpoint real; simulan la respuesta.

### AC-8: Biblioteca de Productos
- El usuario puede guardar, buscar, ver detalles y eliminar productos de su biblioteca.
- Los productos guardados incluyen nombre, marca, nutrición por 100g, ingredientes y alérgenos.

### AC-9: Gratis y Sin Anuncios
- La aplicación es completamente gratuita y no muestra anuncios.
- No hay funciones de pago ni suscripciones.

### AC-10: Alérgenos
- El sistema detecta y muestra alérgenos de los productos.
- **Ejemplo:** El chocolate Dr. Schár detecta: leche, soja, nueces, cacahuetes, gluten.
- **Ejemplo:** El jugo de frutas no tiene alérgenos detectados.
- **Ejemplo:** El aceite de oliva no tiene alérgenos detectados.

---

## 7. Stack Técnico

- **Frontend:** React Native (o React web) — pantalla de usuario
- **Backend/Lógica:** TypeScript — módulos `ocr`, `nutrition`, `storage`
- **OCR:** OpenAI-compatible endpoint (configurable por el usuario)
- **Almacenamiento:** IndexedDB / localStorage (local, sin servidor)
- **Testing:** Jest — mockea OCR y storage

### Estructura de módulos:

```
src/
├── modules/
│   ├── ocr.ts           # OCR con IA (extractNutritionFromImage, configureOcrEndpoint, getOcrConfig)
│   ├── nutrition.ts     # Lógica nutricional (calculateNutritionForAmount, calculateMealTotal, sumNutrition, addCustomField)
│   └── storage.ts       # Almacenamiento local (saveProduct, getProduct, saveMeal, getMeal, etc.)
├── screens/
│   ├── ScanScreen.tsx       # Pantalla de escaneo
│   ├── LibraryScreen.tsx    # Biblioteca de productos
│   ├── MealPlannerScreen.tsx # Planificador de comidas
│   ├── DailySummaryScreen.tsx # Resumen diario
│   └── SettingsScreen.tsx   # Configuración
└── tests/
    ├── ocr.test.ts
    ├── nutrition.test.ts
    └── storage.test.ts
```

---

## 8. Notas de Implementación

- El OCR con IA es el único componente que requiere conexión a internet. Todo lo demás es local.
- Las pruebas mockean `ocr.extractNutritionFromImage()` para devolver datos predefinidos basados en las imágenes de ejemplo.
- Las pruebas mockean `storage.*()` para devolver datos en memoria.
- La nutrición se calcula de forma determinística: `(valorPor100g / 100) * cantidadEnGramos`.
- Los campos personalizados se almacenan en `NutritionFacts.customFields` como un objeto `{ [fieldName: string]: number }`.
- El sistema no requiere registro de usuario ni cuenta. Todo se almacena localmente.