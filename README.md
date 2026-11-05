# Patio El Cordobés

Web estática bilingüe. Cinco páginas: inicio, carta visual con filtros y buscador, celebraciones, galería e información.

## Uso

### Publicar las páginas en Vercel

Importa `Jlproyectia/PatioCordobes` con la rama `main` y Root Directory `./` (la raíz del repositorio, no `patio-web`). El archivo `vercel.json` selecciona el preset Other, omite instalación y compilación, y publica `dist`, donde está `index.html`.

Esta configuración publica las páginas y los archivos multimedia. El servidor de reservas actual usa Cloudflare D1 y un Worker; no se ejecuta en Vercel con esta configuración. Para recibir reservas en Vercel hay que adaptar el servidor y conectar una base de datos persistente y las variables privadas de correo.

`node scripts/redesign.mjs` genera las páginas HTML desde los datos y textos.

`node scripts/serve.mjs` inicia la vista local en http://127.0.0.1:4175.

`node scripts/verify.mjs` comprueba referencias locales, anclas, estructura y requisitos de medios.

Los estilos y comportamiento activos son `dist/redesign.css` y `dist/redesign.js`. La primera propuesta se conserva en `archive/`.

## Contenido y límites

- Logo y vídeos originales de @patioelcordobes. Fuentes tipográficas locales.
- 24 imágenes nuevas generadas/retocadas con la herramienta integrada de imágenes a partir de fotografías reales. Copias PNG completas en `../media/generated-v2`; WebP optimizadas en `dist/assets/images`. Prompts en `image-prompts.json`.
- 26 imágenes adicionales (19 platos y 7 escenas de galería), creadas con la herramienta integrada. PNG en `../media/generated-v3`, WebP en `dist/assets/images` y prompts en `image-prompts-v3.json`.
- Galería de inicio móvil con tres categorías, cuatro imágenes por categoría y carrusel manual; cuadrícula completa en escritorio.
- 32 tarjetas de carta con fotografía; listado completo adicional. Los precios de referencia proceden de la carta publicada en Google en marzo de 2024 y requieren validación. Otros platos muestran «Consultar».
- 143 reseñas de Google de 4 y 5 estrellas (127 de cinco y 16 de cuatro), comprobadas frente a las 165 valoraciones de la ficha el 5 de noviembre de 2026. Incluye valoraciones sin comentario, extractos de hasta 25 palabras y enlaces a la ficha de Google del restaurante. Algunos textos son traducciones de Google. Datos en `scripts/google-reviews.json`, renderizado en `scripts/reviews.mjs`; filtros y paginación en `dist/reviews.js`. No hay sincronización automática con Google Places.
- Reservas por correo con Resend: nombre, email, fecha, 1–30 personas y comida/cena. Solicitudes a Leviturjeman@gmail.com; enlace privado con aprobación manual y correo de confirmación al cliente.
- Vídeos integrados silenciados, reproducción en vista y botón de pausa. Sin modal, sin vídeo en el hero. Reducción de movimiento respetada.
- La demo no utiliza analítica ni cookies de seguimiento propias. Guarda solo la preferencia de idioma en localStorage.

## Validación

Capturas de escritorio y móvil en `qa/`, validación de enlaces locales y referencias, navegación ES/EN, filtros, buscador, estado vacío, cambio de especialidad y reproducción integrada. Las reglas de Taste que prohíben animaciones para restaurantes son incompatibles con la petición expresa del usuario; véase `DESIGN.md`.

Carrusel actualizado: 20 publicaciones únicas del feed de @patioelcordobes, sin historias ni destacados. Vídeos completos optimizados en H.264, reproducción silenciosa dentro de la página, carga al entrar en pantalla y enlace a cada publicación. Selección trazable en scripts/reel-data.mjs; comprobación con node scripts/verify-reels.mjs.


## Reservas por correo

`node scripts/serve.mjs` carga `.env` (excluido de Git) y guarda las reservas locales en `.data/bookings.sqlite`. Usa Node 24. En Sites se usa D1 y las variables privadas del entorno. Ver `.env.example` para los nombres de configuración. El remitente debe pertenecer a un dominio verificado en Resend.

`node scripts/verify-bookings.mjs` comprueba el flujo con envío simulado, validación, reintentos, enlaces caducados y ausencia de confirmación en GET. `node scripts/build-bookings.mjs` prepara el Worker y los archivos públicos. La migración inicial está en `drizzle/0000_bookings.sql`.

Los enlaces de aprobación caducan tras siete días y no confirman por abrirlos: requieren pulsar el botón de la página. Los envíos usan claves de idempotencia de Resend. El sitio conserva su acceso privado; abrirlo al público requiere cambiar ese acceso. No hay confirmación de hora exacta, solo servicio de comida o cena.
