/*
  Descripción del Proyecto: Se desarrollará una aplicación sencilla de lista de tareas donde 
  se puedan agregar, eliminar y listar tareas. La adición y eliminación de tareas se simulará 
  como una petición asincrónica a una "API" mediante setTimeout para emular la latencia de 
  una API.
*/

// Estado
const containerTarea = {
  tareas: [],
  secuenciaId: 1
};

// Validaciones
function validarStringUnicode(stringEntry) {
    if (typeof stringEntry !== "string") return false;

    const s = stringEntry.normalize("NFC").trim();
    if (s.length === 0) return false;

    for (const ch of s) {
        if (ch === " ") continue;
        const lower = ch.toLocaleLowerCase();
        const upper = ch.toLocaleUpperCase();
        if (lower === upper) return false;
    }
    return true;
}
// Core síncrono
function agregarTareaSync(userEntry) {
    const entrada = typeof userEntry === "string" ? userEntry.normalize("NFC").trim() : "";
    if (!validarStringUnicode(entrada)) {
        throw new Error("Descripción inválida: aceptamos UNICODE (solo letras y espacios).");
    }
    const tarea = {
        id: containerTarea.secuenciaId++,
        descripcion: entrada,
        creadoAt: new Date().toISOString()
    };
    containerTarea.tareas.push(tarea);
    return tarea;
}
function obtenerTareasSync() {
    return containerTarea.tareas.slice();
}
function eliminarTareaSync(idTarea) {
    const index = containerTarea.tareas.findIndex(t => t.id === idTarea);
    if (index === -1) return false;
    containerTarea.tareas.splice(index, 1);
    return true;
}

// Helpers asíncronos
function latenciaAleatoria(min = 250, max = 700) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// AGREGAR (POST /tareas)
async function apiAgregarTarea(descripcion, min = 250, max = 700) {
    await esperar(latenciaAleatoria(min, max));
    return agregarTareaSync(descripcion);
}
// OBTENER (GET /tareas)
async function apiObtenerTareas(min = 150, max = 400) {
    await esperar(latenciaAleatoria(min, max));
    return obtenerTareasSync();
}
// ELIMINAR
async function apiEliminarTarea(id, min = 250, max = 700) {
    await esperar(latenciaAleatoria(min, max));
    const ok = eliminarTareaSync(id);
    if (!ok) throw new Error(`No existe la tarea con id=${id}`);
    return true;
}

// Render
function initApp() {
    const $ = (sel) => document.querySelector(sel);
    const form = $("#form-agregar");
    const input = $("#input-desc");
    const btnAgregar = $("#btn-agregar");
    const ulLista = $("#lista-tareas");
    const statusEl = $("#status");

  // UI helpers
    function setLoading(on) {
        if (btnAgregar) btnAgregar.disabled = !!on;
        if (input) input.disabled = !!on;
    }
    function mostrarStatus(msg, tipo = "info") {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color =
        tipo === "error" ? "#ef4444" : tipo === "ok" ? "#22c55e" : "#94a3b8";
    }

  // Render
    function crearElementoTarea(t) {
        const li = document.createElement("li");
        li.className = "tarea-item";
        li.dataset.id = String(t.id);

        const idSpan = document.createElement("span");
        idSpan.className = "id";
        idSpan.textContent = `#${t.id}`;

        const descSpan = document.createElement("span");
        descSpan.className = "desc";
        descSpan.textContent = t.descripcion; // seguro

        const fechaSpan = document.createElement("span");
        fechaSpan.className = "fecha";
        fechaSpan.textContent = new Date(t.creadoAt).toLocaleString();

        const btn = document.createElement("button");
        btn.className = "btn-eliminar";
        btn.textContent = "Eliminar";
        btn.setAttribute("data-id", String(t.id));

        li.appendChild(idSpan);
        li.appendChild(descSpan);
        li.appendChild(fechaSpan);
        li.appendChild(btn);
        return li;
    }

    function renderTareas(tareas) {
        if (!ulLista) return;
        ulLista.innerHTML = "";
        if (!tareas || tareas.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay tareas registradas.";
        li.style.color = "#94a3b8";
        ulLista.appendChild(li);
        return;
        }
        for (const t of tareas) {
        ulLista.appendChild(crearElementoTarea(t));
        }
    }

    async function refrescarListaAsync() {
        try {
        mostrarStatus("Cargando tareas...");
        console.time("api-list");
        const tareas = await apiObtenerTareas();
        console.timeEnd("api-list");
        renderTareas(tareas);
        mostrarStatus(`Tareas cargadas: ${tareas.length}`, "ok");
        } catch (e) {
        console.error(e);
        mostrarStatus("Error al cargar tareas.", "error");
        }
    }

  // Handlers
    async function handleSubmitAgregar(e) {
        e.preventDefault();
        const valor = (input?.value ?? "").trim();
        if (!valor) {
        mostrarStatus("La descripción no puede estar vacía.", "error");
        input?.focus();
        return;
        }
        try {
        setLoading(true);
        mostrarStatus("Agregando tarea...");
        console.time("api-add");
        const creada = await apiAgregarTarea(valor);
        console.timeEnd("api-add");
        input.value = "";
        input.focus();
        await refrescarListaAsync();
        mostrarStatus(`Tarea #${creada.id} agregada.`, "ok");
        } catch (e) {
        console.error(e);
        mostrarStatus(e.message || "Error al agregar.", "error");
        } finally {
        setLoading(false);
        }
    }

    async function handleClickLista(e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        if (target.matches(".btn-eliminar")) {
        const idStr = target.getAttribute("data-id");
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            mostrarStatus("ID inválido.", "error");
            return;
        }
        const okUser = confirm(`¿Eliminar la tarea #${id}?`);
        if (!okUser) return;

        try {
            setLoading(true);
            mostrarStatus(`Eliminando #${id}...`);
            console.time("api-del");
            await apiEliminarTarea(id);
            console.timeEnd("api-del");
            await refrescarListaAsync();
            mostrarStatus(`Tarea #${id} eliminada.`, "ok");
        } catch (e) {
            console.error(e);
            mostrarStatus(e.message || "Error al eliminar.", "error");
        } finally {
            setLoading(false);
        }
        }
    }

    // Listeners
    form?.addEventListener("submit", handleSubmitAgregar);
    ulLista?.addEventListener("click", handleClickLista);

    // Carga inicial
    refrescarListaAsync();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } 
    else {
    initApp();
    }