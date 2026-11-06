// DEVNOTES // MEMORY TERMINAL
// Armazenamento local: os registros permanecem no navegador deste dispositivo.

const notesContainer = document.querySelector("#notes-container");
const noteInput = document.querySelector("#note-content");
const addNoteBtn = document.querySelector(".add-note");
const searchInput = document.querySelector("#search-input");
const exportBtn = document.querySelector("#export-notes");
const notesCount = document.querySelector("#notes-count");
const emptyState = document.querySelector("#empty-state");

function getNotes() {
  try {
    const storedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    if (!Array.isArray(storedNotes)) return [];
    return storedNotes.sort((a, b) => Number(Boolean(b.fixed)) - Number(Boolean(a.fixed)));
  } catch (error) {
    console.warn("Não foi possível ler o arquivo local de notas.", error);
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem("notes", JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar as notas.", error);
    alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanNotes() {
  notesContainer.replaceChildren();
}

function updateCounter(total) {
  notesCount.textContent = `[ ${String(total).padStart(2, "0")} ]`;
}

function createActionButton(className, iconClass, label, onClick, active = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.title = label;
  if (active) button.classList.add("is-fixed");

  const icon = document.createElement("i");
  icon.className = iconClass;
  button.appendChild(icon);
  button.addEventListener("click", onClick);
  return button;
}

function createNote(note) {
  const element = document.createElement("article");
  element.className = "note";
  if (note.fixed) element.classList.add("fixed");

  const textarea = document.createElement("textarea");
  textarea.value = note.content || "";
  textarea.placeholder = "Adicione algum texto...";
  textarea.setAttribute("aria-label", "Conteúdo da anotação");
  textarea.maxLength = 5000;
  textarea.addEventListener("input", () => updateNote(note.id, textarea.value));
  element.appendChild(textarea);

  const index = document.createElement("span");
  index.className = "note-index";
  index.textContent = note.fixed ? "PRIORITY RECORD" : "MEMORY FRAGMENT";
  element.appendChild(index);

  const actions = document.createElement("div");
  actions.className = "note-actions";

  actions.appendChild(createActionButton(
    "pin-button", "bi bi-pin-angle", note.fixed ? "Desafixar anotação" : "Fixar anotação",
    () => toggleFixNote(note.id), Boolean(note.fixed)
  ));
  actions.appendChild(createActionButton(
    "duplicate-button", "bi bi-copy", "Duplicar anotação",
    () => copyNote(note.id)
  ));
  actions.appendChild(createActionButton(
    "delete-button", "bi bi-trash3", "Excluir anotação",
    () => deleteNote(note.id)
  ));

  element.appendChild(actions);
  return element;
}

function renderNotes(notes = getNotes()) {
  cleanNotes();
  notes.forEach((note) => notesContainer.appendChild(createNote(note)));
  updateCounter(notes.length);
  emptyState.hidden = notes.length > 0;
}

function showNotes() {
  renderNotes(getNotes());
}

function addNote() {
  const content = noteInput.value.trim();
  if (!content) {
    noteInput.focus();
    return;
  }

  const notes = getNotes();
  notes.unshift({ id: generateId(), content, fixed: false });
  if (saveNotes(notes)) {
    noteInput.value = "";
    searchInput.value = "";
    showNotes();
    noteInput.focus();
  }
}

function updateNote(id, newContent) {
  const notes = getNotes();
  const target = notes.find((note) => note.id === id);
  if (!target) return;
  target.content = newContent;
  saveNotes(notes);
}

function deleteNote(id) {
  const notes = getNotes().filter((note) => note.id !== id);
  if (saveNotes(notes)) searchNotes(searchInput.value);
}

function toggleFixNote(id) {
  const notes = getNotes();
  const target = notes.find((note) => note.id === id);
  if (!target) return;
  target.fixed = !target.fixed;
  if (saveNotes(notes)) searchNotes(searchInput.value);
}

function searchNotes(search) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const results = getNotes().filter((note) =>
    String(note.content || "").toLocaleLowerCase("pt-BR").includes(term)
  );
  renderNotes(results);
}

function copyNote(id) {
  const notes = getNotes();
  const target = notes.find((note) => note.id === id);
  if (!target) return;

  notes.unshift({
    id: generateId(),
    content: target.content,
    fixed: false,
  });
  if (saveNotes(notes)) searchNotes(searchInput.value);
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportData() {
  const notes = getNotes();
  const rows = [
    ["ID", "Conteúdo", "Fixado?"],
    ...notes.map((note) => [note.id, note.content, note.fixed ? "Sim" : "Não"]),
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map(escapeCSV).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "devnotes-export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Atalhos e eventos
addNoteBtn.addEventListener("click", addNote);
noteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addNote();
});
searchInput.addEventListener("input", (event) => searchNotes(event.target.value));
exportBtn.addEventListener("click", exportData);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== noteInput && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    searchNotes("");
    searchInput.blur();
  }
});

// Inicialização
showNotes();