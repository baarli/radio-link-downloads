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
      var active = b.getAttribute("data-role") === role;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-role-text]").forEach(function (el) {
      el.hidden = el.getAttribute("data-role-text") !== role;
    });
    var offered = false;
    document.querySelectorAll(".dl[data-dl]").forEach(function (el) {
      var forRole = el.getAttribute("data-dl").indexOf(role + "-") === 0;
      el.hidden = !forRole || !el.hasAttribute("href");
      if (!el.hidden) offered = true;
    });
    document.querySelector("[data-download-status]").hidden = offered;
    document.querySelector("[data-release-info]").hidden = !offered;
  }

  function applyOS(os) {
    var span = document.querySelector("[data-detected-os]");
    if (span) span.textContent = os === "windows" ? "Windows" : "macOS";
    // Mark the matching-OS download as primary within the visible role.
    document.querySelectorAll(".dl[data-dl]").forEach(function (el) {
      el.classList.toggle("is-primary", el.getAttribute("data-dl").indexOf(os) !== -1);
    });
  }

  function applyRelease(latest) {
    if (!latest || latest._sample || typeof latest.version !== "string" ||
        !/^v\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(latest.version)) return;

    var releaseBase = "https://github.com/baarli/radio-link-downloads/releases/download/";
    document.querySelector("[data-version]").textContent = latest.version;
    document.querySelectorAll(".dl[data-dl]").forEach(function (link) {
      var filename = link.getAttribute("data-filename");
      var entry = latest.files && latest.files[link.getAttribute("data-dl")];
      if (!entry || entry.name !== filename || !Number.isSafeInteger(entry.size_bytes) || entry.size_bytes < 1 ||
          typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256) || /^0+$/.test(entry.sha256)) return;

      link.href = releaseBase + encodeURIComponent(latest.version) + "/" + encodeURIComponent(filename);
      var metadata = link.querySelector(".dl-meta");
      metadata.textContent = humanSize(entry.size_bytes);
      metadata.title = "SHA-256: " + entry.sha256;
    });
  }

  function init() {
    var os = detectOS();
    var role = "studio";
    applyRole(role);
    applyOS(os);

    document.querySelectorAll("[data-role-toggle] button").forEach(function (b) {
      b.addEventListener("click", function () {
        role = b.getAttribute("data-role");
        applyRole(role);
        applyOS(os);
      });
    });

    fetch("latest.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (latest) {
        applyRelease(latest);
        applyRole(role);
      })
      .catch(function () { /* The page already displays the unavailable state. */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
