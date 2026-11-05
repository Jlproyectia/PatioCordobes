# Patio El Cordobés

Web estática bilingüe. Cinco páginas: inicio, carta visual con filtros y buscador, celebraciones, galería e información.

## Uso

`node scripts/redesign.mjs` genera las páginas HTML desde los datos y textos.

`node scripts/serve.mjs` inicia la vista local en http://127.0.0.1:4175.

`node scripts/verify.mjs` comprueba referencias locales, anclas, estructura y requisitos de medios.

Los estilos y comportamiento activos son `dist/redesign.css` y `dist/redesign.js`. La primera propuesta se conserva en `archive/`.

## Contenido y límites

- Logo y vídeos originales de @patioelcordobes. Fuentes tipográficas locales.
- 24 imágenes nuevas generadas/retocadas con la herramienta integrada de imágenes a partir de fotografías reales. Copias PNG completas en `../media/generated-v2`; WebP optimizadas en `dist/assets/images`. Prompts en `image-prompts.json`.
- 13 tarjetas de carta con fotografía; listado completo adicional. Los precios de referencia proceden de la carta publicada en Google en marzo de 2024 y requieren validación. Otros platos muestran «Consultar».
- 143 reseñas de Google de 4 y 5 estrellas (127 de cinco y 16 de cuatro), comprobadas frente a las 165 valoraciones de la ficha el 5 de noviembre de 2026. Incluye valoraciones sin comentario, extractos de hasta 25 palabras y enlaces al perfil del autor. Algunos textos son traducciones de Google. Datos en `scripts/google-reviews.json`, renderizado en `scripts/reviews.mjs`; filtros y paginación en `dist/reviews.js`. No hay sincronización automática con Google Places.
- Reserva: abre una consulta por WhatsApp; no confirma mesas automáticamente.
- Vídeos integrados silenciados, reproducción en vista y botón de pausa. Sin modal, sin vídeo en el hero. Reducción de movimiento respetada.
- La demo no utiliza analítica ni cookies de seguimiento propias. Guarda solo la preferencia de idioma en localStorage.

## Validación

Capturas de escritorio y móvil en `qa/`, validación de enlaces locales y referencias, navegación ES/EN, filtros, buscador, estado vacío, cambio de especialidad y reproducción integrada. Las reglas de Taste que prohíben animaciones para restaurantes son incompatibles con la petición expresa del usuario; véase `DESIGN.md`.
