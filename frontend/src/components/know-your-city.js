/**
 * KNOW YOUR CITY — feature script
 * Handles tab switching and renders the public transport timing chart.
 *
 * To wire this to live data later, replace `transportData` with a fetch()
 * call to your own API (e.g. GET /api/transport) that returns the same
 * shape, then call renderTransportTable(data) inside the .then().
 */

(function () {
  "use strict";

  /* ---------------- Tabs ---------------- */
  function initTabs() {
    const tabs = document.querySelectorAll("#know-your-city .kyc-tab");
    const panels = document.querySelectorAll("#know-your-city .kyc-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.getAttribute("data-target");

        tabs.forEach((t) => {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
          t.setAttribute("tabindex", "-1");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        tab.setAttribute("tabindex", "0");

        panels.forEach((panel) => {
          const isTarget = panel.id === targetId;
          panel.classList.toggle("is-active", isTarget);
          panel.hidden = !isTarget;
        });
      });
    });
  }

  /* ---------------- Public transport data ----------------
     Sample/representative timings — replace with live data from
     MSRTC / the city transport authority / your own admin panel. */
  const transportData = [
    {
      route: "City Bus Route 1 — Railway Station to CIDCO",
      type: "City Bus",
      first: "6:00 AM",
      last: "10:30 PM",
      frequency: "Every 20 min",
    },
    {
      route: "City Bus Route 4 — Jalna Road to Waluj MIDC",
      type: "City Bus",
      first: "6:15 AM",
      last: "9:45 PM",
      frequency: "Every 25 min",
    },
    {
      route: "City Bus Route 7 — Cidco Bus Stand to Garkheda",
      type: "City Bus",
      first: "6:30 AM",
      last: "9:30 PM",
      frequency: "Every 30 min",
    },
    {
      route: "MSRTC — Chh. Sambhajinagar to Mumbai",
      type: "MSRTC",
      first: "5:30 AM",
      last: "11:30 PM",
      frequency: "Every 45 min",
    },
    {
      route: "MSRTC — Chh. Sambhajinagar to Pune",
      type: "MSRTC",
      first: "5:00 AM",
      last: "11:00 PM",
      frequency: "Every 30 min",
    },
    {
      route: "MSRTC — Chh. Sambhajinagar to Nashik",
      type: "MSRTC",
      first: "6:00 AM",
      last: "9:00 PM",
      frequency: "Every 1 hr",
    },
    {
      route: "Rail — Chh. Sambhajinagar Jn to Mumbai",
      type: "Railway",
      first: "7:10 PM",
      last: "10:40 PM",
      frequency: "2 daily services",
    },
    {
      route: "Rail — Chh. Sambhajinagar Jn to Manmad Jn",
      type: "Railway",
      first: "5:45 AM",
      last: "8:20 PM",
      frequency: "3 daily services",
    },
  ];

  const badgeClass = {
    "City Bus": "kyc-badge--city-bus",
    MSRTC: "kyc-badge--msrtc",
    Railway: "kyc-badge--railway",
  };

  function renderTransportTable(data) {
    const body = document.getElementById("kyc-transport-body");
    if (!body) return;

    body.innerHTML = data
      .map(
        (row) => `
        <tr>
          <td>${row.route}</td>
          <td><span class="kyc-badge ${badgeClass[row.type] || ""}">${row.type}</span></td>
          <td>${row.first}</td>
          <td>${row.last}</td>
          <td>${row.frequency}</td>
        </tr>`
      )
      .join("");
  }

  function initTransportFilters() {
    const filterButtons = document.querySelectorAll("#know-your-city .kyc-filter");

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const filter = btn.getAttribute("data-filter");
        const filtered =
          filter === "All" ? transportData : transportData.filter((row) => row.type === filter);

        renderTransportTable(filtered);
      });
    });
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTransportFilters();
    renderTransportTable(transportData);
  });
})();
