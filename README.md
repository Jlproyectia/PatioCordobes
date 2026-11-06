# Patio El Cordobés

Web estática bilingüe. Cinco páginas: inicio, carta visual con filtros y buscador, celebraciones, galería e información.

## Uso

### Publicar las páginas en Vercel

Importa `Jlproyectia/PatioCordobes` con la rama `main` y Root Directory `./` (la raíz del repositorio, no `patio-web`). El archivo `vercel.json` selecciona el preset Other, instala dependencias con npm ci y omite compilación, y publica `dist`, donde está `index.html`.

La función api/app.js de Vercel recibe las reservas y sirve la carta editable. El estado y las imágenes se guardan en Vercel Blob privado. El servidor antiguo de Cloudflare se conserva como implementación histórica y no recibe solicitudes de producción.

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
- 143 reseñas de Google de 4 y 5 estrellas (127 de cinco y 16 de cuatro), comprobadas frente a las 165 valoraciones de la ficha el 5 de noviembre de 2026. Incluye valoraciones sin comentario, extractos de hasta 25 palabras y enlaces a la ficha de Google del restaurante. Algunos textos son traducciones de Google. Datos en `scripts/google-reviews.json`, renderizado en `scripts/reviews.mjs`; filtros y carrusel horizontal en `dist/reviews.js`. No hay sincronización automática con Google Places.
- Reservas en Vercel con confirmación manual desde Administración. No hay envío automático de correos; el propietario debe avisar al cliente.
- Vídeos integrados silenciados, reproducción en vista y botón de pausa. Sin modal, sin vídeo en el hero. Reducción de movimiento respetada.
- La demo no utiliza analítica ni cookies de seguimiento propias. Guarda solo la preferencia de idioma en localStorage.

## Validación

Capturas de escritorio y móvil en `qa/`, validación de enlaces locales y referencias, navegación ES/EN, filtros, buscador, estado vacío, cambio de especialidad y reproducción integrada. Las reglas de Taste que prohíben animaciones para restaurantes son incompatibles con la petición expresa del usuario; véase `DESIGN.md`.

Carrusel actualizado: 20 publicaciones únicas del feed de @patioelcordobes, sin historias ni destacados. Vídeos completos optimizados en H.264, reproducción silenciosa dentro de la página, carga al entrar en pantalla y enlace a cada publicación. Selección trazable en scripts/reel-data.mjs; comprobación con node scripts/verify-reels.mjs.


## Implementación histórica de correo (no activa en Vercel)

`node scripts/serve.mjs` carga `.env` (excluido de Git) y guarda las reservas locales en `.data/bookings.sqlite`. Usa Node 24. En Sites se usa D1 y las variables privadas del entorno. Ver `.env.example` para los nombres de configuración. El remitente debe pertenecer a un dominio verificado en Resend.

`node scripts/verify-bookings.mjs` comprueba el flujo con envío simulado, validación, reintentos, enlaces caducados y ausencia de confirmación en GET. `node scripts/build-bookings.mjs` prepara el Worker y los archivos públicos. La migración inicial está en `drizzle/0000_bookings.sql`.

Los enlaces de aprobación caducan tras siete días y no confirman por abrirlos: requieren pulsar el botón de la página. Los envíos usan claves de idempotencia de Resend. El sitio conserva su acceso privado; abrirlo al público requiere cambiar ese acceso. No hay confirmación de hora exacta, solo servicio de comida o cena.

Las reservas se abren en un panel modal centrado, con cierre mediante Escape, botón o fondo. Las reseñas se deslizan horizontalmente y conservan los filtros de puntuación.

La sección de cocina usa un recorrido de cuatro especialidades al desplazar la página: foto, categoría y texto sincronizados, con pestañas manuales y navegación de teclado. Con reducción de movimiento se desactiva el recorrido fijo. Comportamiento en `dist/kitchen.js`.


## Administración en Vercel

Acceso desde el pie junto a Descubre o /admin.html, solo para el propietario con PIN. Permite crear y editar platos, precios, fotografías, traducciones y disponibilidad; y ver, confirmar, cancelar o modificar fecha, personas y servicio de las nuevas reservas. Los cambios aparecen en la carta sin otro despliegue. No se migran automáticamente reservas del servidor antiguo.

Variables privadas: BLOB_READ_WRITE_TOKEN, ADMIN_PIN_HASH (salt:scrypt hexadecimal de 64 bytes), ADMIN_SESSION_SECRET y APP_ORIGIN. Nunca guardar PIN ni secretos en Git. Para cambiar el PIN, actualizar su hash en Vercel; rotar el secreto de sesión invalida sesiones existentes.

El estado usa escrituras condicionales por ETag. Las reservas requieren sesión HttpOnly de ocho horas. Los cambios requieren origen válido y token CSRF. Los intentos de PIN y solicitudes públicas tienen límites persistentes. Las imágenes de carta son públicas mediante un endpoint limitado a ese tipo de archivo.

Validación: npm ci, npm run test:admin y node scripts/verify.mjs. El servidor estático local no ejecuta la función Vercel. Producción se actualiza mediante push a main.

Reels móviles: `dist/film-player.js` reproduce un único vídeo visible, espera al final del deslizamiento y libera los decodificadores fuera de pantalla. Una portada independiente permanece visible hasta recibir un fotograma y cubre esperas, errores y pausas. Los reels arrancan silenciados automáticamente, sin botón de play superpuesto; un control global permite pausar o reanudar. El vídeo activo permanece renderizado bajo la portada para evitar interferir con las políticas de visibilidad de Safari. Se conserva el búfer del reel contiguo al retroceder y se liberan los lejanos. Los originales disponibles se exportan en H.264 hasta 1080p, YUV420p, 30 fps y fast-start; cuatro fuentes limitadas a 720p conservan su resolución. El caudal de las versiones Full HD se limita a 3 Mbps. `node scripts/verify-reels.mjs` comprueba formato, dimensiones, portadas y posición del índice MP4.

## Editor general del propietario

Administración incluye Carta, Reservas, Toda la web, Categorías y Horarios y calendario. El propietario puede editar el contenido existente de Inicio, Carta, Celebraciones, Galería e Información, además de cabecera, pie, logotipo, fotografías, enlaces y los textos dinámicos de cocina. Los vídeos admiten enlaces HTTPS directos a MP4; sus portadas se cambian como imágenes. El editor ofrece búsqueda por página y sección, vista previa con selección al pulsar y restauración del contenido original. No permite introducir código HTML ejecutable.

`node scripts/redesign.mjs` genera las páginas y ejecuta `scripts/cms-build.mjs`: añade identificadores de contenido y actualiza `server/site-manifest.json`. No ejecutar el anotador directamente sobre HTML ya anotado. Los valores personalizados y sus versiones se conservan en el almacén privado, separados del HTML base. Los textos comunes de cabecera/pie y el logotipo comparten cambios entre páginas.

Los nombres de categorías cambian sin mover los platos. El horario semanal, los servicios y cierres excepcionales se aplican tanto a la web como a la validación de reservas en el servidor. Modificar horarios no cancela reservas existentes ni envía notificaciones. Las escrituras de contenido, categorías y horarios requieren sesión, origen autorizado, CSRF y versión vigente. `npm run test:admin` incluye pruebas de contenido, restauración, categorías, calendario y protección de enlaces e imágenes.
