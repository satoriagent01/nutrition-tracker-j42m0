# NutriTrack 🥗

**Nutrition Tracker** — una app gratuita y sin anuncios para rastrear la nutrición de los productos que compras.

## ¿Qué hace?

- **Escanear etiquetas**: Tomá o subí fotos de las tablas nutricionales de los productos del supermercado. La OCR con IA extrae automáticamente la información nutricional (energía, grasas, carbohidratos, azúcares, fibra, proteínas, sal, etc.).
- **Planificar comidas**: Agregá productos a tus comidas especificando la cantidad en gramos y calculá el total nutricional automáticamente.
- **Rastreo personalizado**: Seguí cualquier nutriente que quieras — calorías, sodio, grasas saturadas, etc. No está limitado a un solo objetivo como bajar de peso o cuidar el corazón.
- **Resumen diario**: Veá el total nutricional de todos tus alimentos del día.

## Cómo ejecutar

```bash
npx serve .
```

Luego abrí `/public/` en tu navegador (ej: `http://localhost:3000/public/`).

> **Importante**: La app debe servirse (no abrir `index.html` directamente con `file://`), porque los navegadores no cargan módulos ES desde `file://`.

## Cómo configurar el endpoint de IA

1. Abrí la pantalla de **Ajustes** (⚙️) desde el menú inferior.
2. Completá los campos:
   - **URL del endpoint**: La dirección de tu servicio OCR compatible con OpenAI (ej: `https://api.openai.com/v1/chat/completions`).
   - **Clave API**: Tu clave de API.
   - **Modelo**: El modelo a usar (ej: `gpt-4o`).
3. Guardá los cambios. La configuración se almacena en el navegador (localStorage).

## Cómo probar

```bash
npm test
```

Los tests verifican:
- Extracción OCR simulada (AC-1, AC-2)
- Cálculos nutricionales: escalado por cantidad, totales de comidas, campos personalizados (AC-3, AC-4, AC-5)
- Operaciones de almacenamiento: guardar, leer, eliminar productos y comidas (AC-6, AC-7, AC-8)
- Resumen diario (AC-9)

## Pantallas

| Pantalla | Descripción |
|----------|-------------|
| 📷 Escanear | Tomá o subí una foto de una etiqueta nutricional. La OCR extrae los datos y los muestra para verificación antes de guardar. |
| 📚 Productos | Lista todos los productos escaneados. Buscá, mirá detalles y eliminá productos. |
| 🍽️ Comidas | Planificá comidas agregando productos con cantidades en gramos. Se calculan los totales automáticamente. |
| 📊 Resumen | Resumen nutricional diario con totales de todos los nutrientes. |
| ⚙️ Ajustes | Configurá el endpoint de OCR (URL, clave, modelo). |

## Tecnologías

- HTML, CSS y JavaScript vanilla (ES modules)
- Sin framework, sin build step
- localStorage para persistencia
- OCR simulado (mocked) para testing; en producción se conecta a un endpoint OpenAI-compatible

## Lo que no está hecho aún

- La OCR real con IA (actualmente está simulada/mocked para testing)
- Reconocimiento de código de barras
- Sincronización en la nube
- Exportación de datos
- Modo offline (PWA)

## Licencia

MIT