// Fills KV latency metrics on /admin/performance after first paint.

(function () {
  const readEl = document.querySelector("[data-perf-read]");
  const writeEl = document.querySelector("[data-perf-write]");
  if (!(readEl instanceof HTMLElement) || !(writeEl instanceof HTMLElement)) {
    return;
  }

  const withWrite =
    new URLSearchParams(location.search).get("writeProbe") === "1";
  const url = withWrite ? "/admin/api/perf-kv?write=1" : "/admin/api/perf-kv";

  function fmt(ms) {
    return ms.toFixed(1) + " ms";
  }

  fetch(url, { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("probe failed");
      return res.json();
    })
    .then(function (data) {
      readEl.textContent = fmt(data.avgReadMs);
      writeEl.textContent = data.avgWriteMs == null
        ? "not run"
        : fmt(data.avgWriteMs);
    })
    .catch(function () {
      readEl.textContent = "error";
      if (writeEl.textContent === "…") writeEl.textContent = "error";
    });
})();
