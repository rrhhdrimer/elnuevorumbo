# TEO El Nuevo Rumbo

Recorrido digital de Drimer · Talento Humano. Seis momentos en un mapa interactivo, cada uno abre un libro con la historia de TEO, y al final un reto de cinco preguntas.

- Interfaz estática (HTML, CSS y JavaScript, sin compilación), publicada en GitHub Pages.
- Registro central en Google Sheets mediante Google Apps Script.
- Avance de cada participante guardado en el navegador (localStorage), separado por DNI.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Pantallas: bienvenida, registro, mapa, libro, reto y resultado |
| `js/content.js` | **Todo el contenido editable**: textos, preguntas, rutas de imagen, coordenadas del mapa y URL del servidor |
| `js/state.js` | Reglas: momentos en orden, ciclos de tres oportunidades, mejor nota |
| `js/sync.js` | Envío al servidor con una única operación pendiente y reintentos |
| `js/app.js` | Navegación e interfaz |
| `css/styles.css` | Estilos |
| `apps-script/Code.gs` | Código para la hoja de Google |
| `tests/reglas.test.mjs` | Pruebas de reglas (`node tests/reglas.test.mjs`) |

## Imágenes que entrega Drimer

Basta con copiar los archivos con estos nombres; mientras falten se muestra un espacio provisional con la descripción de la escena.

| Archivo | Uso |
| --- | --- |
| `assets/img/mapa/mapa_base.png` | Mapa base (proporción 16:10, se recomienda 3200 × 2000 px) |
| `assets/img/teo_corriendo.png` | TEO corriendo, fondo transparente (ya incluido) |
| `assets/img/logo_teo_elnuevorumbo.jpg` | Logo oficial de la aventura (ya incluido) |
| `assets/img/escenas/m01_izq.png` … `m05_der.png` | Diez escenas de los momentos 1 a 5 (proporción 4:3) |
| `assets/img/escenas/m06_centro.png` | Composición central del momento 6 (proporción 16:7) |

Si el mapa final ubica el camino en otro lugar, se ajustan `MAP.stops` y `MAP.segments` en `js/content.js` (coordenadas sobre 1600 × 1000).

## Conectar la hoja de Google

1. Abrir la hoja de cálculo del proyecto e ir a **Extensiones > Apps Script**.
2. Borrar el contenido de `Code.gs`, pegar el de `apps-script/Code.gs` y guardar.
3. **Implementar > Nueva implementación > Tipo: Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**.
4. Autorizar los permisos que pide Google (solo acceso a esta hoja).
5. Copiar la URL que termina en `/exec` y pegarla en `API_URL` dentro de `js/content.js`.

La hoja crea sola la pestaña **Participantes** con una fila por DNI: DNI, nombre, momentos completados, estado del reto, mejor nota y fecha de primera finalización (hora de Lima). No guarda intentos, historial de notas ni respuestas. Para el reporte: **Archivo > Descargar > Excel o CSV**.

Si se cambia `Code.gs`, hay que usar **Implementar > Administrar implementaciones > Editar > Nueva versión** para conservar la misma URL.

## Publicar en GitHub Pages

**Settings > Pages > Source: Deploy from a branch > `main` / raíz**. El sitio queda en `https://rrhhdrimer.github.io/elnuevorumbo/`.

## Reglas implementadas

- Registro con DNI (8 dígitos, conservado como texto) y nombre. Es identificación declarada, no autenticación.
- Momentos en orden; solo **Continuar recorrido** completa un momento. Cerrar con X o Escape no lo completa. Revisar un momento no mueve a TEO.
- Cada ciclo de lectura completo habilita tres oportunidades. Con 20 el reto se cierra. Sin oportunidades y con menos de 20, **Repetir historia para mejorar** reinicia el ciclo y conserva la mejor nota.
- El navegador calcula y muestra la nota al instante; el servidor la recalcula con las respuestas y guarda la mayor.
- El contador de oportunidades es local: cambiar de equipo o borrar los datos del sitio lo reinicia.
