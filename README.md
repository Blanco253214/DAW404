# DAW404
Repositorio de la materia: Desarrollo de Aplicaciones Web con Software Interpretados en el Cliente

Investigación Aplicada 1 — Lista de Tareas (JS)

## Descripción
Aplicación web sencilla para agregar, listar y eliminar tareas.  
La adición y eliminación se simulan como *peticiones asíncronas* usando `setTimeout` para emular la latencia de una API, según la pauta del proyecto.

## Características
- Core síncrono (agregar, obtener, eliminar).
- “API” asincrónica con latencia artificial (`await esperar()`).
- Eventos: submit del formulario y delegación de click para eliminar.
- Render seguro con `textContent`.
- Medición de rendimiento usando `console.time()`.

## Archivos
- `index.html` — estructura y interfaz.
- `style.css` — estilos simples (tema oscuro).
- `codex.js` — lógica completa (core + API + UI).

