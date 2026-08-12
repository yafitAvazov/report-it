const defaultReports = [
  { id: "demo-1", title: "אשפה בפארק", category: "אשפה ולכלוך", description: "אשפה מפוזרת ליד מתקני המשחקים בפארק הילדים.", place: "פארק הילדים · לפני שעתיים", location: "רחוב הגפן, תל אביב-יפו", status: "התקבל", type: "pending", visual: "litter", icon: "🗑️", coordinates: [34.7819, 32.0854], timeline: [{ title: "הדיווח התקבל", text: "הפנייה נקלטה במערכת העירונית.", time: "היום, 10:32" }] },
  { id: "demo-2", title: "פח מלא ברחוב הראשי", category: "פח מלא", description: "הפח בפינת הרחוב מלא ואשפה נמצאת גם סביבו.", place: "רחוב העצמאות · אתמול", location: "העצמאות 18, תל אביב-יפו", status: "בטיפול", type: "progress", visual: "bin", icon: "♻️", coordinates: [34.7789, 32.0871], timeline: [{ title: "הדיווח התקבל", text: "הפנייה נקלטה במערכת העירונית.", time: "אתמול, 16:05" }, { title: "הועבר לטיפול", text: "הדיווח הועבר לצוות הניקיון האזורי.", time: "היום, 08:15" }] },
  { id: "demo-3", title: "גזם על המדרכה", category: "גזם", description: "ערימת גזם חוסמת חלק מהמעבר על המדרכה.", place: "רחוב הגפן · לפני יומיים", location: "רחוב הגפן 7, תל אביב-יפו", status: "נפתר", type: "resolved", visual: "garden", icon: "🌿", coordinates: [34.7846, 32.0834], timeline: [{ title: "הדיווח התקבל", text: "הפנייה נקלטה במערכת העירונית.", time: "לפני יומיים, 11:20" }, { title: "הועבר לטיפול", text: "הדיווח הועבר לצוות הניקיון האזורי.", time: "לפני יומיים, 13:40" }, { title: "הטיפול הושלם", text: "הצוות עדכן שהגזם נאסף.", time: "אתמול, 09:10" }] },
];

function readLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const reports = readLocal("report-it-reports", defaultReports);

function saveReports() {
  try {
    localStorage.setItem("report-it-reports", JSON.stringify(reports));
  } catch {
    localStorage.setItem("report-it-reports", JSON.stringify(reports.map(({ imageUrl, ...report }) => report)));
    showToast("התמונה גדולה מדי לשמירה קבועה, אך הדיווח נשמר.");
  }
}

const reportsList = document.querySelector("#reportsList");
const toast = document.querySelector("#toast");
const homeView = document.querySelector("#homeView");
const accountView = document.querySelector("#accountView");
const nearbyView = document.querySelector("#nearbyView");
const myReportsView = document.querySelector("#myReportsView");
const reportDetailView = document.querySelector("#reportDetailView");
const reportView = document.querySelector("#reportView");
const mediaLocationView = document.querySelector("#mediaLocationView");
const reviewView = document.querySelector("#reviewView");
const successView = document.querySelector("#successView");
const reportForm = document.querySelector("#reportForm");
const categoryGrid = document.querySelector("#categoryGrid");
const categoryError = document.querySelector("#categoryError");
const descriptionInput = document.querySelector("#reportDescription");
const descriptionCount = document.querySelector("#descriptionCount");
const descriptionError = document.querySelector("#descriptionError");
const cameraInput = document.querySelector("#cameraInput");
const galleryInput = document.querySelector("#galleryInput");
const photoEmptyState = document.querySelector("#photoEmptyState");
const photoPreview = document.querySelector("#photoPreview");
const photoImage = document.querySelector("#photoImage");
const locationStatus = document.querySelector("#locationStatus");
const useCurrentLocationButton = document.querySelector("#useCurrentLocationButton");
const manualMap = document.querySelector("#manualMap");
const selectionMap = document.querySelector("#selectionMap");
const mapSelectionNote = document.querySelector("#mapSelectionNote");
const locationError = document.querySelector("#locationError");
const reviewPhotoImage = document.querySelector("#reviewPhotoImage");
const reviewPhotoPlaceholder = document.querySelector("#reviewPhotoPlaceholder");
const reviewReportHeading = document.querySelector("#reviewReportHeading");
const reviewReportDescription = document.querySelector("#reviewReportDescription");
const reviewCategory = document.querySelector("#reviewCategory");
const reviewLocation = document.querySelector("#reviewLocation");
const submitReportButton = document.querySelector("#submitReportButton");
const myReportsList = document.querySelector("#myReportsList");
const statusFilter = document.querySelector("#statusFilter");
const reportsEmptyState = document.querySelector("#reportsEmptyState");
const detailVisual = document.querySelector("#detailVisual");
const detailIcon = document.querySelector("#detailIcon");
const detailImage = document.querySelector("#detailImage");
const detailMapCanvas = document.querySelector("#detailMapCanvas");
const nearbyCategoryFilter = document.querySelector("#nearbyCategoryFilter");
const nearbyStatusFilter = document.querySelector("#nearbyStatusFilter");
let selectedNearbyReportId = null;
let detailOrigin = "myReports";
let toastTimer;
let selectedImageUrl = "";
let selectedLocation = null;
let reportCounter = 3074;
let currentUser = readLocal("report-it-user", { name: "יעל", email: "yael@example.com" });
let authMode = "login";
const defaultMapCenter = [34.7818, 32.0853];
const mapStyle = "https://tiles.openfreemap.org/styles/liberty";
const rtlTextPluginUrl = "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js";
let homeMap;
let nearbyMap;
let selectionMapInstance;
let selectionMarker;
let mapSelectionOverlay;
let nearbyMapMarkers = [];
let detailMap;
let detailMapMarker;

function createMap(container, zoom) {
  if (!window.maplibregl) return null;
  return new maplibregl.Map({ container, style: mapStyle, center: defaultMapCenter, zoom, attributionControl: true });
}

function reportMarker(report, selected = false) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `report-map-marker${selected ? " is-selected" : ""}`;
  element.setAttribute("aria-label", `${report.title}, ${report.status}`);
  element.innerHTML = `<span>${report.icon}</span>`;
  element.addEventListener("click", () => selectNearbyReport(report.id));
  return new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(report.coordinates || defaultMapCenter);
}

function renderMapMarkers(visibleReports) {
  nearbyMapMarkers.forEach((marker) => marker.remove());
  nearbyMapMarkers = [];
  if (!nearbyMap) return;
  nearbyMapMarkers = visibleReports.map((report) => reportMarker(report, report.id === selectedNearbyReportId).addTo(nearbyMap));
}

function selectNearbyReport(reportId) {
  selectedNearbyReportId = reportId;
  const report = reports.find((item) => item.id === reportId);
  if (!report) return;
  const status = document.querySelector("#nearbySheetStatus");
  status.className = `status ${report.type}`;
  status.textContent = report.status;
  document.querySelector("#nearbySheetTitle").textContent = report.title;
  document.querySelector("#nearbySheetMeta").textContent = `${report.location} · ${report.place}`;
  document.querySelector("#nearbySheet").hidden = false;
  nearbyMap?.flyTo({ center: report.coordinates || defaultMapCenter, zoom: Math.max(nearbyMap.getZoom(), 15) });
  renderNearbyReports();
}

function initializeMaps() {
  homeMap = createMap("homeMap", 14.5);
  nearbyMap = createMap("nearbyMapCanvas", 14.5);
  if (!homeMap || !nearbyMap) {
    showToast("לא הצלחנו לטעון את המפה. בדקי את החיבור לאינטרנט.");
    return;
  }
  homeMap.on("load", () => reports.slice(0, 3).forEach((report) => reportMarker(report).addTo(homeMap)));
  nearbyMap.on("load", () => renderNearbyReports());
}

function updateDetailMap(report) {
  if (!window.maplibregl) return;
  if (!detailMap) detailMap = createMap("detailMapCanvas", 16);
  if (!detailMap) return;
  const coordinates = report.coordinates || defaultMapCenter;
  detailMapMarker?.remove();
  detailMapMarker = new maplibregl.Marker({ color: "#20683d" }).setLngLat(coordinates).addTo(detailMap);
  detailMap.flyTo({ center: coordinates, zoom: 16, essential: true });
  window.setTimeout(() => detailMap.resize(), 0);
}

async function initializeMapSupport() {
  if (!window.maplibregl?.setRTLTextPlugin) {
    initializeMaps();
    return;
  }

  try {
    await maplibregl.setRTLTextPlugin(rtlTextPluginUrl, false);
  } catch {
    // The map remains usable if the optional language plugin cannot load.
  }
  initializeMaps();
}

function ensureSelectionMap() {
  if (selectionMapInstance) {
    selectionMapInstance.resize();
    return;
  }
  selectionMapInstance = createMap("selectionMap", 15);
  if (!selectionMapInstance) {
    mapSelectionNote.textContent = "לא הצלחנו לטעון את המפה. נסי שוב בעוד רגע.";
    return;
  }
  mapSelectionOverlay = document.createElement("button");
  mapSelectionOverlay.className = "map-selection-overlay";
  mapSelectionOverlay.type = "button";
  mapSelectionOverlay.setAttribute("aria-label", "לחצי לסימון מיקום במפה");
  selectionMap.append(mapSelectionOverlay);
  selectionMapInstance.on("load", () => {
    mapSelectionNote.textContent = "לחצי על המפה כדי לסמן את מיקום המפגע.";
    selectionMapInstance.resize();
  });
  mapSelectionOverlay.addEventListener("click", (event) => {
    const bounds = selectionMap.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const scale = 0.012 / 2 ** (selectionMapInstance.getZoom() - 14);
    const coordinates = [
      selectionMapInstance.getCenter().lng + relativeX * scale,
      selectionMapInstance.getCenter().lat - relativeY * scale,
    ];
    selectMapLocation(coordinates);
    mapSelectionNote.textContent = "המיקום סומן. אפשר להמשיך לסיכום הדיווח.";
  }, true);
}

function selectMapLocation(coordinates) {
  setLocation("מיקום נבחר במפה", `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`, coordinates);
  reverseGeocodeSelectedLocation(coordinates);
  try {
    if (!selectionMarker) selectionMarker = new maplibregl.Marker({ color: "#20683d" }).addTo(selectionMapInstance);
    selectionMarker.setLngLat(coordinates);
  } catch {
    // The report can proceed even if the marker cannot render during a map reload.
  }
}

async function reverseGeocodeSelectedLocation([longitude, latitude]) {
  if (!selectedLocation || selectedLocation.coordinates?.[0] !== longitude || selectedLocation.coordinates?.[1] !== latitude) return;
  selectedLocation.addressPending = true;
  selectedLocation.addressResolved = false;
  locationStatus.querySelector("strong").textContent = "מאתרים רחוב ועיר…";
  locationStatus.querySelector("p").textContent = "הכתובת תישמר יחד עם הדיווח.";
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=he&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
    if (!response.ok) throw new Error("Address lookup failed");
    const { address = {} } = await response.json();
    const street = [address.road || address.pedestrian || address.footway || address.neighbourhood, address.house_number].filter(Boolean).join(" ");
    const city = address.city || address.town || address.village || address.municipality || address.city_district || address.county;
    if (!street && !city) throw new Error("No address found");
    const addressText = [street || "מיקום שסומן", city].filter(Boolean).join(", ");
    if (selectedLocation?.coordinates?.[0] === longitude && selectedLocation?.coordinates?.[1] === latitude) {
      selectedLocation.details = addressText;
      selectedLocation.title = addressText;
      selectedLocation.addressPending = false;
      selectedLocation.addressResolved = true;
      locationStatus.querySelector("strong").textContent = "המיקום נבחר";
      locationStatus.querySelector("p").textContent = addressText;
    }
  } catch {
    if (selectedLocation?.coordinates?.[0] === longitude && selectedLocation?.coordinates?.[1] === latitude) {
      selectedLocation.addressPending = false;
      selectedLocation.addressResolved = false;
      locationStatus.querySelector("strong").textContent = "לא נמצאה כתובת למיקום";
      locationStatus.querySelector("p").textContent = "נסי לסמן מקום קרוב יותר לרחוב.";
      locationError.textContent = "לא הצלחנו להמיר את הנקודה לרחוב ולעיר. נסי לבחור מקום אחר במפה.";
    }
  }
}

function renderReports() {
  reportsList.innerHTML = reports.slice(0, 3).map((report) => reportCardTemplate(report)).join("");
  renderMyReports();
  renderNearbyReports();
}

function renderNearbyReports() {
  const category = nearbyCategoryFilter.value;
  const status = nearbyStatusFilter.value;
  const visible = reports.filter((report) => (category === "all" || report.category === category) && (status === "all" || report.type === status));
  renderMapMarkers(visible);
  document.querySelector("#nearbyEmpty").hidden = visible.length > 0;
  document.querySelector("#nearbyMap").hidden = visible.length === 0;
  if (!visible.some((report) => report.id === selectedNearbyReportId)) document.querySelector("#nearbySheet").hidden = true;
}

function reportCardTemplate(report, full = false) {
  const visual = report.imageUrl
    ? `<img src="${escapeHtml(report.imageUrl)}" alt="תמונת המפגע: ${escapeHtml(report.title)}" />`
    : escapeHtml(report.icon);
  return `
    <${full ? "button" : "article"} class="report-card ${full ? "full-report-card" : ""}" ${full ? `type="button" data-report-id="${report.id}"` : "tabindex=\"0\""} aria-label="${escapeHtml(report.title)}, ${escapeHtml(report.status)}">
      <div class="report-visual ${report.visual}">${visual}</div>
      <div class="report-content"><h3>${escapeHtml(report.title)}</h3><p>${escapeHtml(report.location)}</p><p>${escapeHtml(report.place)}</p></div>
      <span class="status ${report.type}">${escapeHtml(report.status)}</span>
    </${full ? "button" : "article"}>
  `;
}

function renderMyReports() {
  const selectedStatus = statusFilter.value;
  const visibleReports = selectedStatus === "all" ? reports : reports.filter((report) => report.type === selectedStatus);
  myReportsList.innerHTML = visibleReports.map((report) => reportCardTemplate(report, true)).join("");
  reportsEmptyState.hidden = visibleReports.length > 0;
  myReportsList.hidden = visibleReports.length === 0;
  const countLabel = visibleReports.length === 1 ? "פנייה אחת" : `${visibleReports.length} פניות`;
  document.querySelector("#reportsSummary").textContent = selectedStatus === "all" ? `${countLabel}, מהחדש לישן.` : `${countLabel} בסטטוס שנבחר.`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function openReportForm() {
  homeView.hidden = true;
  accountView.hidden = true;
  myReportsView.hidden = true;
  reportDetailView.hidden = true;
  reportView.hidden = false;
  document.body.classList.add("is-reporting");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeReportForm() {
  reportView.hidden = true;
  mediaLocationView.hidden = true;
  reviewView.hidden = true;
  successView.hidden = true;
  reportDetailView.hidden = true;
  nearbyView.hidden = true;
  homeView.hidden = false;
  accountView.hidden = true;
  myReportsView.hidden = true;
  document.body.classList.remove("is-reporting");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderAccount() {
  const signedIn = Boolean(currentUser);
  document.querySelector("#signedInCard").hidden = !signedIn;
  document.querySelector("#authCard").hidden = signedIn;
  if (signedIn) {
    document.querySelector("#accountName").textContent = currentUser.name;
    document.querySelector("#accountEmail").textContent = currentUser.email;
    document.querySelector("#accountAvatar").textContent = currentUser.name.slice(0, 1);
    document.querySelector("#pageTitle").textContent = `בוקר טוב, ${currentUser.name}`;
  }
}

function openAccount() {
  homeView.hidden = true;
  nearbyView.hidden = true;
  myReportsView.hidden = true;
  reportDetailView.hidden = true;
  accountView.hidden = false;
  document.body.classList.remove("is-reporting");
  renderAccount();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeAccount() {
  accountView.hidden = true;
  homeView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authMode === mode));
  document.querySelector("#signupNameLabel").hidden = mode !== "signup";
  document.querySelector("#authSubmitButton").textContent = mode === "signup" ? "יצירת חשבון" : "התחברות";
  document.querySelector("#authError").textContent = "";
}

function openMyReports() {
  homeView.hidden = true;
  nearbyView.hidden = true;
  reportView.hidden = true;
  mediaLocationView.hidden = true;
  reviewView.hidden = true;
  successView.hidden = true;
  reportDetailView.hidden = true;
  myReportsView.hidden = false;
  document.body.classList.remove("is-reporting");
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === "reports"));
  renderMyReports();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeMyReports() {
  myReportsView.hidden = true;
  homeView.hidden = false;
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === "home"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openNearby() {
  homeView.hidden = true;
  myReportsView.hidden = true;
  reportDetailView.hidden = true;
  nearbyView.hidden = false;
  document.body.classList.remove("is-reporting");
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === "nearby"));
  renderNearbyReports();
  window.setTimeout(() => nearbyMap?.resize(), 0);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeNearby() {
  nearbyView.hidden = true;
  homeView.hidden = false;
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === "home"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openReportDetail(reportId, origin = "myReports") {
  const report = reports.find((item) => item.id === reportId);
  if (!report) return;

  document.querySelector("#detailReference").textContent = report.id.startsWith("report-") ? `פנייה ${report.id.replace("report-", "RI-2026-")}` : "פנייה למוקד העירוני";
  document.querySelector("#detailTitle").textContent = "פרטי דיווח";
  document.querySelector("#detailDate").textContent = report.place;
  document.querySelector("#detailHeading").textContent = report.title;
  document.querySelector("#detailDescription").textContent = report.description;
  document.querySelector("#detailLocationText").textContent = report.location;
  const detailStatus = document.querySelector("#detailStatus");
  detailStatus.className = `status ${report.type}`;
  detailStatus.textContent = report.status;
  detailIcon.textContent = report.icon;
  detailImage.hidden = !report.imageUrl;
  detailIcon.hidden = Boolean(report.imageUrl);
  if (report.imageUrl) detailImage.src = report.imageUrl;
  document.querySelector("#statusTimeline").innerHTML = report.timeline.map((entry) => `
    <li class="is-complete"><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.text)}</p><time>${escapeHtml(entry.time)}</time></li>
  `).join("");
  detailOrigin = origin;
  document.querySelector("#backFromDetailButton").setAttribute("aria-label", origin === "nearby" ? "חזרה למפת הדיווחים" : "חזרה לדיווחים שלי");
  myReportsView.hidden = true;
  nearbyView.hidden = true;
  reportDetailView.hidden = false;
  updateDetailMap(report);
  document.body.classList.add("is-reporting");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function closeReportDetail() {
  reportDetailView.hidden = true;
  if (detailOrigin === "nearby") {
    nearbyView.hidden = false;
  } else {
    myReportsView.hidden = false;
  }
  document.body.classList.remove("is-reporting");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openMediaLocationForm() {
  reportView.hidden = true;
  mediaLocationView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function returnToDetails() {
  mediaLocationView.hidden = true;
  reportView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openReview() {
  if (selectedLocation.addressPending) {
    showToast("מאתרים את הרחוב והעיר… נסי שוב בעוד רגע.");
    return;
  }
  if (!selectedLocation.addressResolved) {
    locationError.textContent = "צריך רחוב ועיר כדי לשמור את הדיווח. נסי לבחור מקום אחר במפה.";
    return;
  }
  const category = reportForm.elements.category.value;
  const title = document.querySelector("#reportTitleInput").value.trim();
  const description = descriptionInput.value.trim();
  reviewReportHeading.textContent = title || category;
  reviewReportDescription.textContent = description;
  reviewCategory.textContent = category;
  reviewLocation.textContent = selectedLocation.details;
  reviewPhotoImage.hidden = !selectedImageUrl;
  reviewPhotoPlaceholder.hidden = Boolean(selectedImageUrl);
  if (selectedImageUrl) reviewPhotoImage.src = selectedImageUrl;
  mediaLocationView.hidden = true;
  reviewView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function returnToMediaLocation() {
  reviewView.hidden = true;
  mediaLocationView.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function resetDraft() {
  reportForm.reset();
  clearValidation();
  updateDescriptionCount();
  clearSelectedPhoto();
  selectedLocation = null;
  locationStatus.classList.remove("is-selected");
  locationStatus.querySelector("strong").textContent = "עדיין לא נבחר מיקום";
  locationStatus.querySelector("p").textContent = "אפשר להשתמש במיקום הנוכחי או לבחור ידנית.";
  manualMap.hidden = true;
  selectionMarker?.remove();
  selectionMarker = null;
  mapSelectionNote.textContent = "לחצי על המפה כדי לסמן את מיקום המפגע.";
  locationError.textContent = "";
}

function clearValidation() {
  categoryGrid.parentElement.classList.remove("has-error");
  document.querySelector(".text-fields").classList.remove("has-error");
  categoryError.textContent = "";
  descriptionError.textContent = "";
}

function updateDescriptionCount() {
  descriptionCount.textContent = `${descriptionInput.value.length}/300`;
}

document.querySelector("#newReportButton").addEventListener("click", openReportForm);
document.querySelector("#backToHomeButton").addEventListener("click", closeReportForm);
document.querySelector("#backToDetailsButton").addEventListener("click", returnToDetails);
document.querySelector("#backToMediaButton").addEventListener("click", returnToMediaLocation);
document.querySelector("#backFromReportsButton").addEventListener("click", closeMyReports);
document.querySelector("#backFromDetailButton").addEventListener("click", closeReportDetail);
document.querySelector("#backFromNearbyButton").addEventListener("click", closeNearby);
document.querySelector("#backFromAccountButton").addEventListener("click", closeAccount);
document.querySelector("#listNewReportButton").addEventListener("click", openReportForm);
document.querySelector("#nearbyButton").addEventListener("click", openNearby);
document.querySelector("#allReportsButton").addEventListener("click", openMyReports);
document.querySelector("#profileButton").addEventListener("click", openAccount);

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.screen === "reports") {
      openMyReports();
      return;
    }
    if (button.dataset.screen === "nearby") {
      openNearby();
      return;
    }
    if (button.dataset.screen === "home") {
      closeMyReports();
      return;
    }
    document.querySelector(".nav-item.is-active").classList.remove("is-active");
    button.classList.add("is-active");
    showToast(button.dataset.screen === "home" ? "את כבר במסך הבית." : "המסך ייבנה בשלב המתאים בתוכנית העבודה.");
  });
});

statusFilter.addEventListener("change", renderMyReports);
document.querySelector("#resetFilterButton").addEventListener("click", () => {
  statusFilter.value = "all";
  renderMyReports();
});

myReportsList.addEventListener("click", (event) => {
  const card = event.target.closest(".full-report-card");
  if (card) openReportDetail(card.dataset.reportId);
});

nearbyCategoryFilter.addEventListener("change", renderNearbyReports);
nearbyStatusFilter.addEventListener("change", renderNearbyReports);
document.querySelector("#nearbyDetailButton").addEventListener("click", () => openReportDetail(selectedNearbyReportId, "nearby"));
function centerMapOnCurrentLocation(map) {
  if (!navigator.geolocation) {
    showToast("הדפדפן במכשיר הזה לא תומך במיקום.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 16 }),
    () => showToast("לא הצלחנו לקבל את המיקום שלך."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}
document.querySelector("#homeLocationButton").addEventListener("click", () => centerMapOnCurrentLocation(homeMap));
document.querySelector("#nearbyLocationButton").addEventListener("click", () => centerMapOnCurrentLocation(nearbyMap));

document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
document.querySelector("#logoutButton").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("report-it-user");
  setAuthMode("login");
  renderAccount();
});
document.querySelector("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#authEmail").value.trim();
  const name = document.querySelector("#signupName").value.trim();
  const authError = document.querySelector("#authError");
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    authError.textContent = "הזיני כתובת אימייל תקינה.";
    return;
  }
  if (authMode === "signup" && name.length < 2) {
    authError.textContent = "הזיני שם כדי ליצור חשבון.";
    return;
  }
  currentUser = { name: authMode === "signup" ? name : email.split("@")[0], email };
  localStorage.setItem("report-it-user", JSON.stringify(currentUser));
  renderAccount();
  showToast("התחברת בהצלחה.");
});

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearValidation();
  const category = reportForm.elements.category.value;
  const description = descriptionInput.value.trim();
  let hasError = false;

  if (!category) {
    categoryGrid.parentElement.classList.add("has-error");
    categoryError.textContent = "בחרי סוג מפגע כדי להמשיך.";
    hasError = true;
  }

  if (description.length < 5) {
    document.querySelector(".text-fields").classList.add("has-error");
    descriptionError.textContent = "כתבי לפחות 5 תווים על המפגע.";
    hasError = true;
  }

  if (hasError) return;
  openMediaLocationForm();
});

reportForm.elements.category.forEach((input) => input.addEventListener("change", clearValidation));
descriptionInput.addEventListener("input", () => {
  updateDescriptionCount();
  if (descriptionInput.value.trim().length >= 5) {
    document.querySelector(".text-fields").classList.remove("has-error");
    descriptionError.textContent = "";
  }
});

function showSelectedPhoto(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedImageUrl = reader.result;
    photoImage.src = selectedImageUrl;
    photoEmptyState.hidden = true;
    photoPreview.hidden = false;
  });
  reader.readAsDataURL(file);
}

function clearSelectedPhoto() {
  selectedImageUrl = "";
  photoImage.removeAttribute("src");
  cameraInput.value = "";
  galleryInput.value = "";
  photoPreview.hidden = true;
  photoEmptyState.hidden = false;
}

function setLocation(title, details, coordinates = null) {
  selectedLocation = { title, details, coordinates, addressPending: Boolean(coordinates), addressResolved: !coordinates };
  locationStatus.classList.add("is-selected");
  locationStatus.querySelector("strong").textContent = title;
  locationStatus.querySelector("p").textContent = details;
  locationError.textContent = "";
  document.querySelector(".location-section").classList.remove("has-error");
}

function handlePhotoInput(event) {
  showSelectedPhoto(event.target.files[0]);
}

cameraInput.addEventListener("change", handlePhotoInput);
galleryInput.addEventListener("change", handlePhotoInput);
document.querySelector("#removePhotoButton").addEventListener("click", clearSelectedPhoto);

useCurrentLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation || !window.isSecureContext) {
    manualMap.hidden = false;
    document.querySelector("#toggleMapButton").textContent = "הסתרת המפה";
    ensureSelectionMap();
    locationError.textContent = "כדי להשתמש במיקום הנוכחי פתחי את האפליקציה דרך אתר מאובטח (HTTPS). אפשר לבחור מיקום במפה.";
    return;
  }

  useCurrentLocationButton.disabled = true;
  useCurrentLocationButton.textContent = "מאתרים את המיקום…";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setLocation("המיקום הנוכחי נבחר", `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, [longitude, latitude]);
      reverseGeocodeSelectedLocation([longitude, latitude]);
      selectionMapInstance?.flyTo({ center: [longitude, latitude], zoom: 16 });
      if (!selectionMarker && selectionMapInstance) selectionMarker = new maplibregl.Marker({ color: "#20683d" }).addTo(selectionMapInstance);
      selectionMarker?.setLngLat([longitude, latitude]);
      useCurrentLocationButton.disabled = false;
      useCurrentLocationButton.innerHTML = "<span aria-hidden=\"true\">⌖</span> השתמשי במיקום הנוכחי";
    },
    (error) => {
      useCurrentLocationButton.disabled = false;
      useCurrentLocationButton.innerHTML = "<span aria-hidden=\"true\">⌖</span> השתמשי במיקום הנוכחי";
      manualMap.hidden = false;
      document.querySelector("#toggleMapButton").textContent = "הסתרת המפה";
      ensureSelectionMap();
      const message = error.code === error.PERMISSION_DENIED
        ? "לא ניתנה הרשאה למיקום. אפשרי הרשאת מיקום בדפדפן או בחרי מקום במפה."
        : "לא הצלחנו לאתר את המיקום. אפשר לבחור מקום במפה.";
      locationError.textContent = message;
      showToast(message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
});

document.querySelector("#toggleMapButton").addEventListener("click", () => {
  manualMap.hidden = !manualMap.hidden;
  document.querySelector("#toggleMapButton").textContent = manualMap.hidden ? "או בחרי מקום במפה" : "הסתרת המפה";
  if (!manualMap.hidden) window.setTimeout(ensureSelectionMap, 0);
});

document.querySelector("#confirmMapLocationButton").addEventListener("click", () => {
  if (!selectionMapInstance) {
    ensureSelectionMap();
    return;
  }
  const center = selectionMapInstance.getCenter();
  const coordinates = [center?.lng ?? defaultMapCenter[0], center?.lat ?? defaultMapCenter[1]];
  selectMapLocation(coordinates);
  mapSelectionNote.textContent = "המיקום במרכז המפה סומן. אפשר להמשיך לסיכום הדיווח.";
});

document.querySelector("#reviewReportButton").addEventListener("click", () => {
  if (!selectedLocation) {
    document.querySelector(".location-section").classList.add("has-error");
    locationError.textContent = "בחרי מיקום כדי להמשיך.";
    return;
  }
  openReview();
});

submitReportButton.addEventListener("click", () => {
  submitReportButton.disabled = true;
  submitReportButton.textContent = "שולחים את הדיווח…";
  document.querySelector("#sendError").textContent = "";

  window.setTimeout(() => {
    reportCounter += 1;
    const category = reportForm.elements.category.value;
    const title = document.querySelector("#reportTitleInput").value.trim() || category;
    const description = descriptionInput.value.trim();
    const submittedImageUrl = selectedImageUrl;
    const icons = { "אשפה ולכלוך": "🗑️", "פח מלא": "♻️", "גזם": "🌿", "מפגע סביבתי": "🌍", "בור בכביש": "🕳️", "תאורת רחוב": "💡", "דליפת מים": "💧", "מדרכה פגומה": "🚧", "מפגע בטיחותי": "⚠️", "אחר": "📍" };
    const newReport = { id: `report-${reportCounter}`, title, category, description, place: "דיווח חדש · עכשיו", location: selectedLocation.details, status: "התקבל", type: "pending", visual: "litter", icon: icons[category] || "📍", imageUrl: submittedImageUrl, coordinates: selectedLocation.coordinates || defaultMapCenter, timeline: [{ title: "הדיווח התקבל", text: "הפנייה נקלטה במערכת העירונית.", time: "עכשיו" }] };
    reports.unshift(newReport);
    selectedImageUrl = "";
    saveReports();
    selectedNearbyReportId = newReport.id;
    renderReports();
    nearbyMap?.flyTo({ center: newReport.coordinates, zoom: 16 });
    selectNearbyReport(newReport.id);
    document.querySelector("#referenceNumber").textContent = `RI-2026-${reportCounter}`;
    reviewView.hidden = true;
    successView.hidden = false;
    submitReportButton.disabled = false;
    submitReportButton.textContent = "שלחי דיווח";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, 750);
});

document.querySelector("#successHomeButton").addEventListener("click", () => {
  successView.hidden = true;
  homeView.hidden = false;
  document.body.classList.remove("is-reporting");
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === "home"));
  resetDraft();
  window.scrollTo({ top: 0, behavior: "instant" });
});

renderReports();
updateDescriptionCount();
renderAccount();
initializeMapSupport();
