// Progressive enhancement for the admin menu builder: HTML5 drag reorder
// without a Preact island (avoids cold Vite compile lag on /admin/menu).

(function () {
  const root = document.querySelector("[data-menu-builder]");
  if (!(root instanceof HTMLElement)) return;

  const list = root.querySelector("[data-menu-list]");
  const orderInput = root.querySelector("[data-menu-order]");
  const saveBtn = root.querySelector("[data-menu-save]");
  const dirtyLabel = root.querySelector("[data-menu-dirty]");
  if (
    !(list instanceof HTMLElement) ||
    !(orderInput instanceof HTMLInputElement) ||
    !(saveBtn instanceof HTMLButtonElement)
  ) {
    return;
  }

  const initial = orderInput.dataset.menuOrderInitial || orderInput.value;
  let dragging = null;

  function currentIds() {
    return Array.from(list.querySelectorAll("[data-menu-id]"))
      .map(function (row) {
        return row.dataset.menuId;
      })
      .filter(Boolean);
  }

  function sync() {
    const ids = currentIds();
    orderInput.value = JSON.stringify(ids);
    const dirty = orderInput.value !== initial;
    saveBtn.disabled = !dirty;
    if (dirtyLabel instanceof HTMLElement) {
      dirtyLabel.classList.toggle("hidden", !dirty);
    }
  }

  function rowFromEvent(e) {
    const target = e.target;
    if (!(target instanceof Element)) return null;
    return target.closest("[data-menu-id]");
  }

  list.addEventListener("dragstart", function (e) {
    const row = rowFromEvent(e);
    if (!row) return;
    dragging = row;
    row.classList.add("opacity-60", "border-gray-500");
    row.classList.remove("border-gray-200", "dark:border-gray-700");
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", row.dataset.menuId || "");
      e.dataTransfer.effectAllowed = "move";
    }
  });

  list.addEventListener("dragend", function () {
    if (dragging) {
      dragging.classList.remove("opacity-60", "border-gray-500");
      dragging.classList.add("border-gray-200", "dark:border-gray-700");
    }
    dragging = null;
  });

  list.addEventListener("dragover", function (e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });

  list.addEventListener("dragenter", function (e) {
    e.preventDefault();
    const row = rowFromEvent(e);
    if (!dragging || !row || row === dragging) return;
    const rows = Array.from(list.children);
    const from = rows.indexOf(dragging);
    const to = rows.indexOf(row);
    if (from < 0 || to < 0 || from === to) return;
    if (from < to) {
      list.insertBefore(dragging, row.nextSibling);
    } else {
      list.insertBefore(dragging, row);
    }
    sync();
  });

  sync();
})();
