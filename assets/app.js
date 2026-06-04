// Radio Link download page — OS detection, role toggle, latest.json rendering.
(function () {
  "use strict";

  function detectOS() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    var ua = navigator.userAgent || "";
    if (/mac/i.test(p) || /mac os x/i.test(ua)) return "macos";
    if (/win/i.test(p) || /windows/i.test(ua)) return "windows";
    return "macos"; // sensible default for this user base
  }

  function humanSize(bytes) {
    if (!bytes) return "";
    var mb = bytes / (1024 * 1024);
    return "(" + mb.toFixed(1) + " MB)";
  }

  function applyRole(role) {
    document.querySelectorAll("[data-role-toggle] button").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-role") === role);
    });
    document.querySelectorAll("[data-role-text]").forEach(function (el) {
      el.hidden = el.getAttribute("data-role-text") !== role;
    });
    // Show only this role's downloads.
    document.querySelectorAll(".dl[data-dl]").forEach(function (el) {
      var forRole = el.getAttribute("data-dl").indexOf(role) === 0;
      el.hidden = !forRole;
    });
  }

  function applyOS(os) {
    var span = document.querySelector("[data-detected-os]");
    if (span) span.textContent = os === "windows" ? "Windows" : "macOS";
    // Mark the matching-OS download as primary within the visible role.
    document.querySelectorAll(".dl[data-dl]").forEach(function (el) {
      el.classList.toggle("is-primary", el.getAttribute("data-dl").indexOf(os) !== -1);
    });
  }

  function fillMeta(latest) {
    var v = document.querySelector("[data-version]");
    if (v) v.textContent = latest.version || "";
    Object.keys(latest.files || {}).forEach(function (key) {
      var entry = latest.files[key];
      document.querySelectorAll('[data-meta="' + key + '"]').forEach(function (el) {
        el.textContent = humanSize(entry.size_bytes);
        el.title = "SHA-256: " + (entry.sha256 || "");
      });
    });
  }

  function init() {
    var os = detectOS();
    applyRole("studio");
    applyOS(os);

    document.querySelectorAll("[data-role-toggle] button").forEach(function (b) {
      b.addEventListener("click", function () {
        applyRole(b.getAttribute("data-role"));
        applyOS(os);
      });
    });

    fetch("latest.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (latest) { if (latest) fillMeta(latest); })
      .catch(function () { /* offline / first deploy — links still work */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
