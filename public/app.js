import { extractNutritionFromImage, configureOcrEndpoint, getOcrConfig } from "../src/ocr.js";
import { calculateNutritionForAmount, calculateMealTotal, sumNutrition, addCustomField } from "../src/nutrition.js";
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

// ── State ──────────────────────────────────────────────────────────────────
let currentExtraction = null;
let foodItems = [];
let savedProducts = [];

// ── Helpers ────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function formatNutrition(n) {
  if (!n) return "";
  const fields = [
    { key: "energyKj", label: "Energía (kJ)", fmt: (v) => v.toFixed(0) + " kJ" },
    { key: "energyKcal", label: "Energía (kcal)", fmt: (v) => v.toFixed(1) + " kcal" },
    { key: "fat", label: "Grasa", fmt: (v) => v.toFixed(1) + " g" },
    { key: "saturatedFat", label: "Grasa saturada", fmt: (v) => v.toFixed(1) + " g" },
    { key: "carbohydrates", label: "Carbohidratos", fmt: (v) => v.toFixed(1) + " g" },
    { key: "sugars", label: "Azúcares", fmt: (v) => v.toFixed(1) + " g" },
    { key: "fiber", label: "Fibra", fmt: (v) => v.toFixed(1) + " g" },
    { key: "protein", label: "Proteína", fmt: (v) => v.toFixed(1) + " g" },
    { key: "salt", label: "Sal", fmt: (v) => v.toFixed(2) + " g" },
  ];
  return fields
    .map((f) => {
      const val = n[f.key];
      if (val == null || val === 0) return "";
      return `<div class="nutrition-row"><span class="nutrition-label">${f.label}:</span> <span class="nutrition-value">${f.fmt(val)}</span></div>`;
    })
    .filter(Boolean)
    .join("");
}

function formatNutritionTable(n) {
  if (!n) return "";
  const fields = [
    { key: "energyKj", label: "Energía (kJ)" },
    { key: "energyKcal", label: "Energía (kcal)" },
    { key: "fat", label: "Grasa" },
    { key: "saturatedFat", label: "Grasa saturada" },
    { key: "carbohydrates", label: "Carbohidratos" },
    { key: "sugars", label: "Azúcares" },
    { key: "fiber", label: "Fibra" },
    { key: "protein", label: "Proteína" },
    { key: "salt", label: "Sal" },
  ];
  let html = '<table class="nutrition-table"><thead><tr><th>Componente</th><th>Valor</th></tr></thead><tbody>';
  for (const f of fields) {
    const val = n[f.key];
    if (val == null) continue;
    const unit = f.key === "energyKj" || f.key === "energyKcal" ? "" : " g";
    html += `<tr><td>${f.label}</td><td>${typeof val === "number" ? val.toFixed(2).replace(/\.?0+$/, "") : val}${unit}</td></tr>`;
  }
  if (n.customFields) {
    for (const [key, val] of Object.entries(n.customFields)) {
      html += `<tr><td>${key}</td><td>${val}</td></tr>`;
    }
  }
  html += "</tbody></table>";
  return html;
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const screen = document.getElementById(`${name}-screen`);
  if (screen) screen.classList.add("active");
  const btn = document.querySelector(`.nav-btn[data-screen="${name}"]`);
  if (btn) btn.classList.add("active");
}

// ── Scan Screen ────────────────────────────────────────────────────────────
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById("preview-img").src = dataUrl;
    document.getElementById("preview-container").classList.remove("hidden");
    document.getElementById("extraction-result").classList.add("hidden");
    document.getElementById("extraction-loading").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

async function extractFromImage() {
  const previewImg = document.getElementById("preview-img");
  if (!previewImg.src || previewImg.src === window.location.href) return;

  document.getElementById("extraction-loading").classList.remove("hidden");
  document.getElementById("extraction-result").classList.add("hidden");

  try {
    // Use the data URL as imageData identifier
    const result = await extractNutritionFromImage(previewImg.src);

    if (result.success && result.product) {
      currentExtraction = result;
      document.getElementById("product-name").value = result.product.name || "";
      document.getElementById("product-brand").value = result.product.brand || "";

      let detailsHtml = `<p><strong>Confianza:</strong> ${(result.confidence * 100).toFixed(0)}%</p>`;
      if (result.detectedLanguage) {
        detailsHtml += `<p><strong>Idioma detectado:</strong> ${result.detectedLanguage}</p>`;
      }
      detailsHtml += formatNutritionTable(result.product.nutritionPer100g);
      document.getElementById("extraction-details").innerHTML = detailsHtml;
      document.getElementById("extraction-result").classList.remove("hidden");
    } else {
      document.getElementById("extraction-details").innerHTML = `<p class="error">${result.error || "No se pudo extraer información."}</p>`;
      document.getElementById("extraction-result").classList.remove("hidden");
      currentExtraction = null;
    }
  } catch (err) {
    document.getElementById("extraction-details").innerHTML = `<p class="error">Error: ${err.message}</p>`;
    document.getElementById("extraction-result").classList.remove("hidden");
    currentExtraction = null;
  } finally {
    document.getElementById("extraction-loading").classList.add("hidden");
  }
}

async function saveProductFromExtraction() {
  if (!currentExtraction || !currentExtraction.product) return;

  const product = {
    id: generateId(),
    name: document.getElementById("product-name").value || currentExtraction.product.name,
    brand: document.getElementById("product-brand").value || currentExtraction.product.brand,
    nutritionPer100g: { ...currentExtraction.product.nutritionPer100g },
    servingSize: currentExtraction.product.servingSize,
    servingAmount: currentExtraction.product.servingAmount,
    unit: currentExtraction.product.unit,
    ingredients: currentExtraction.product.ingredients,
    allergens: currentExtraction.product.allergens || [],
  };

  await saveProduct(product);
  savedProducts = await getAllProducts();
  renderProductsList();

  // Reset scan screen
  currentExtraction = null;
  document.getElementById("preview-container").classList.add("hidden");
  document.getElementById("extraction-result").classList.add("hidden");
  document.getElementById("preview-img").src = "";
  document.getElementById("product-name").value = "";
  document.getElementById("product-brand").value = "";

  alert("Producto guardado correctamente.");
  showScreen("library");
}

function cancelExtraction() {
  currentExtraction = null;
  document.getElementById("preview-container").classList.add("hidden");
  document.getElementById("extraction-result").classList.add("hidden");
  document.getElementById("preview-img").src = "";
  document.getElementById("product-name").value = "";
  document.getElementById("product-brand").value = "";
}

function discardProduct() {
  currentExtraction = null;
  document.getElementById("extraction-result").classList.add("hidden");
  document.getElementById("product-name").value = "";
  document.getElementById("product-brand").value = "";
}

// ── Library Screen ─────────────────────────────────────────────────────────
async function renderProductsList(filter = "") {
  const list = document.getElementById("products-list");
  const noProducts = document.getElementById("no-products");

  if (savedProducts.length === 0) {
    list.innerHTML = "";
    noProducts.classList.remove("hidden");
    return;
  }

  noProducts.classList.add("hidden");
  const filtered = filter
    ? savedProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(filter.toLowerCase()))
      )
    : savedProducts;

  list.innerHTML = filtered
    .map(
      (p) => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-info">
        <h4>${p.name}</h4>
        ${p.brand ? `<p class="product-brand">${p.brand}</p>` : ""}
        ${formatNutrition(p.nutritionPer100g)}
      </div>
      <div class="product-actions">
        <button class="btn-small add-to-meal" data-id="${p.id}">➕ Agregar a comida</button>
        <button class="btn-small delete-product" data-id="${p.id}">🗑️ Eliminar</button>
      </div>
    </div>
  `
    )
    .join("");

  // Attach event listeners
  list.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar este producto?")) {
        await deleteProduct(id);
        savedProducts = await getAllProducts();
        renderProductsList(document.getElementById("search-input").value);
      }
    });
  });

  list.querySelectorAll(".add-to-meal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const product = savedProducts.find((p) => p.id === id);
      if (product) {
        addFoodItemToMeal(product);
        showScreen("meal");
      }
    });
  });
}

// ── Meal Planner Screen ────────────────────────────────────────────────────
function addFoodItemToMeal(product) {
  const existing = foodItems.find((fi) => fi.productId === product.id);
  if (existing) {
    existing.grams = parseInt(prompt(`Ya agregaste "${product.name}". Ingresa los gramos:`, existing.grams.toString())) || existing.grams;
  } else {
    const grams = parseInt(prompt(`¿Cuántos gramos de "${product.name}"?`, "100")) || 100;
    const nutrition = calculateNutritionForAmount(product.nutritionPer100g, grams);
    foodItems.push({
      productId: product.id,
      productName: product.name,
      grams,
      nutrition,
    });
  }
  renderFoodItems();
}

function renderFoodItems() {
  const container = document.getElementById("food-items-container");
  if (foodItems.length === 0) {
    container.innerHTML = '<p class="empty-state">No hay productos en esta comida. Agrega productos desde la biblioteca.</p>';
    document.getElementById("meal-totals").classList.add("hidden");
    return;
  }

  container.innerHTML = foodItems
    .map(
      (fi, idx) => `
    <div class="food-item-row">
      <div class="food-item-info">
        <strong>${fi.productName}</strong>
        <span>${fi.grams}g</span>
        ${formatNutrition(fi.nutrition)}
      </div>
      <div class="food-item-actions">
        <input type="number" class="grams-input" value="${fi.grams}" min="0" data-idx="${idx}" placeholder="Gramos">
        <button class="btn-small remove-food-item" data-idx="${idx}">✕</button>
      </div>
    </div>
  `
    )
    .join("");

  // Update nutrition when grams change
  container.querySelectorAll(".grams-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const grams = parseFloat(e.target.value) || 0;
      const product = savedProducts.find((p) => p.id === foodItems[idx].productId);
      if (product) {
        foodItems[idx].grams = grams;
        foodItems[idx].nutrition = calculateNutritionForAmount(product.nutritionPer100g, grams);
      }
      renderFoodItems();
      updateMealTotals();
    });
  });

  container.querySelectorAll(".remove-food-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      foodItems.splice(idx, 1);
      renderFoodItems();
      updateMealTotals();
    });
  });

  updateMealTotals();
}

function updateMealTotals() {
  const totalsDiv = document.getElementById("meal-totals");
  const detailsDiv = document.getElementById("meal-totals-details");

  if (foodItems.length === 0) {
    totalsDiv.classList.add("hidden");
    return;
  }

  const total = calculateMealTotal(foodItems);
  detailsDiv.innerHTML = formatNutritionTable(total);
  totalsDiv.classList.remove("hidden");
}

async function saveMealFn() {
  const name = document.getElementById("meal-name").value.trim();
  const date = document.getElementById("meal-date").value;

  if (!name) {
    alert("Ingresa un nombre para la comida.");
    return;
  }
  if (!date) {
    alert("Selecciona una fecha.");
    return;
  }
  if (foodItems.length === 0) {
    alert("Agrega al menos un producto a la comida.");
    return;
  }

  const totalNutrition = calculateMealTotal(foodItems);

  const meal = {
    id: generateId(),
    name,
    date,
    foodItems: foodItems.map((fi) => ({
      productId: fi.productId,
      productName: fi.productName,
      grams: fi.grams,
      nutrition: { ...fi.nutrition },
    })),
    totalNutrition,
  };

  await saveMeal(meal);
  foodItems = [];
  document.getElementById("meal-name").value = "";
  renderFoodItems();
  renderMealsList();
  alert("Comida guardada correctamente.");
}

async function renderMealsList() {
  const mealsDiv = document.getElementById("meals-list");
  const allMeals = await getAllMeals();
  const today = new Date().toISOString().split("T")[0];
  const todayMeals = allMeals.filter((m) => m.date === today);

  if (todayMeals.length === 0) {
    mealsDiv.innerHTML = '<h3>Comidas Guardadas</h3><p class="empty-state">No hay comidas para hoy.</p>';
    return;
  }

  mealsDiv.innerHTML = `
    <h3>Comidas Guardadas</h3>
    ${todayMeals
      .map(
        (m) => `
      <div class="meal-card">
        <div class="meal-info">
          <h4>${m.name}</h4>
          <p>${m.date}</p>
          ${formatNutrition(m.totalNutrition)}
        </div>
        <button class="btn-small delete-meal" data-id="${m.id}">🗑️ Eliminar</button>
      </div>
    `
      )
      .join("")}
  `;

  mealsDiv.querySelectorAll(".delete-meal").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar esta comida?")) {
        await deleteMeal(id);
        renderMealsList();
      }
    });
  });
}

// ── Daily Summary Screen ───────────────────────────────────────────────────
async function renderDailySummary() {
  const dateInput = document.getElementById("summary-date");
  const date = dateInput.value || new Date().toISOString().split("T")[0];

  const dailyLog = await getDailyLog(date);
  const meals = await getMealsByDate(date);

  const summaryDiv = document.getElementById("daily-summary");
  const noSummary = document.getElementById("no-summary");
  const summaryDetails = document.getElementById("summary-details");
  const mealsSummary = document.getElementById("meals-summary");

  const hasData = dailyLog.energyKcal > 0 || Object.values(dailyLog).some((v) => v > 0);

  if (!hasData) {
    summaryDiv.classList.add("hidden");
    noSummary.classList.remove("hidden");
    return;
  }

  noSummary.classList.add("hidden");
  summaryDiv.classList.remove("hidden");

  summaryDetails.innerHTML = formatNutritionTable(dailyLog);

  if (meals.length > 0) {
    mealsSummary.innerHTML = meals
      .map(
        (m) => `
      <div class="meal-card">
        <h4>${m.name}</h4>
        ${formatNutrition(m.totalNutrition)}
      </div>
    `
      )
      .join("");
  } else {
    mealsSummary.innerHTML = '<p class="empty-state">No hay comidas registradas para esta fecha.</p>';
  }
}

// ── Settings Screen ────────────────────────────────────────────────────────
async function loadSettings() {
  const config = await getOcrConfig();
  if (config) {
    document.getElementById("ocr-url").value = config.url || "";
    document.getElementById("ocr-key").value = config.key || "";
    document.getElementById("ocr-model").value = config.model || "";
  }
}

async function saveSettings() {
  const url = document.getElementById("ocr-url").value.trim();
  const key = document.getElementById("ocr-key").value.trim();
  const model = document.getElementById("ocr-model").value.trim();

  if (!url || !key || !model) {
    alert("Completa todos los campos del endpoint OCR.");
    return;
  }

  const config = { url, key, model };
  await saveOcrConfig(config);
  configureOcrEndpoint(config);

  const status = document.getElementById("settings-status");
  status.textContent = "Ajustes guardados correctamente.";
  status.classList.remove("hidden");
  setTimeout(() => status.classList.add("hidden"), 3000);
}

async function clearSettings() {
  await saveOcrConfig(null);
  configureOcrEndpoint(null);
  document.getElementById("ocr-url").value = "";
  document.getElementById("ocr-key").value = "";
  document.getElementById("ocr-model").value = "";
  const status = document.getElementById("settings-status");
  status.textContent = "Ajustes eliminados.";
  status.classList.remove("hidden");
  setTimeout(() => status.classList.add("hidden"), 3000);
}

// ── Custom Fields ──────────────────────────────────────────────────────────
function addCustomFieldUI() {
  const field = prompt("Nombre del campo personalizado (ej: sodio, fibra adicional):");
  if (!field) return;
  const value = parseFloat(prompt(`Valor de ${field}:`));
  if (isNaN(value)) return;

  // We'll add it to the daily summary display
  const summaryDetails = document.getElementById("summary-details");
  const customRow = document.createElement("div");
  customRow.className = "nutrition-row custom-field";
  customRow.innerHTML = `<span class="nutrition-label">${field}:</span> <span class="nutrition-value">${value}</span>`;
  summaryDetails.appendChild(customRow);
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("meal-date").value = today;
  document.getElementById("summary-date").value = today;

  // Load OCR config
  const config = await getOcrConfig();
  if (config) {
    configureOcrEndpoint(config);
  }

  // Load products
  savedProducts = await getAllProducts();
  renderProductsList();

  // Load meals
  renderMealsList();

  // Load settings
  loadSettings();

  // ── Event Listeners ──

  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.screen);
      if (btn.dataset.screen === "library") {
        renderProductsList(document.getElementById("search-input").value);
      } else if (btn.dataset.screen === "meal") {
        renderFoodItems();
        renderMealsList();
      } else if (btn.dataset.screen === "summary") {
        renderDailySummary();
      }
    });
  });

  // Scan screen
  document.getElementById("camera-btn").addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.capture = "environment";
    fileInput.onchange = (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    };
    fileInput.click();
  });

  document.getElementById("file-btn").addEventListener("click", () => {
    const fileInput = document.getElementById("file-input");
    fileInput.onchange = (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    };
    fileInput.click();
  });

  // Drag and drop
  const uploadArea = document.getElementById("upload-area");
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });
  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  document.getElementById("extract-btn").addEventListener("click", extractFromImage);
  document.getElementById("cancel-extract-btn").addEventListener("click", cancelExtraction);
  document.getElementById("save-product-btn").addEventListener("click", saveProductFromExtraction);
  document.getElementById("discard-product-btn").addEventListener("click", discardProduct);

  // Library
  document.getElementById("search-input").addEventListener("input", (e) => {
    renderProductsList(e.target.value);
  });

  // Meal planner
  document.getElementById("add-food-btn").addEventListener("click", () => {
    if (savedProducts.length === 0) {
      alert("No hay productos guardados. Escanea una etiqueta primero.");
      showScreen("library");
      return;
    }
    // Show product selection
    const productNames = savedProducts.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const choice = prompt(`Selecciona un producto:\n${productNames}\n\nIngresa el número:`);
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < savedProducts.length) {
      addFoodItemToMeal(savedProducts[idx]);
    }
  });

  document.getElementById("save-meal-btn").addEventListener("click", saveMealFn);

  // Summary
  document.getElementById("summary-date").addEventListener("change", renderDailySummary);

  // Settings
  document.getElementById("save-settings-btn").addEventListener("click", saveSettings);
  document.getElementById("clear-settings-btn").addEventListener("click", clearSettings);
}

init();