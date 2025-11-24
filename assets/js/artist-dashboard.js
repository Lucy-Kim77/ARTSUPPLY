// assets/js/artist-dashboard.js
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "./firebase-config.js";

const loadingSection = document.getElementById("artist-loading");
const deniedSection = document.getElementById("artist-denied");
const deniedMessage = document.getElementById("artist-denied-message");
const dashboardSection = document.getElementById("artist-dashboard");

const artistNameSpan = document.getElementById("artist-name");
const artistEmailSpan = document.getElementById("artist-email");

const addEmbedForm = document.getElementById("add-embed-form");
const embedTitleInput = document.getElementById("embed-title");
const embedCodeInput = document.getElementById("embed-code");
const embedError = document.getElementById("embed-error");
const embedList = document.getElementById("embed-list");

function showState(state) {
  if (loadingSection) loadingSection.style.display = state === "loading" ? "block" : "none";
  if (deniedSection) deniedSection.style.display = state === "denied" ? "block" : "none";
  if (dashboardSection) dashboardSection.style.display = state === "dashboard" ? "block" : "none";
}

// Render a single embed doc into the list
function renderEmbed(docId, data) {
  if (!embedList) return;

  const item = document.createElement("div");
  item.className = "embed-item";
  item.dataset.id = docId;

  const heading = document.createElement("h3");
  heading.textContent = data.title || "Untitled release";
  item.appendChild(heading);

  const raw = data.raw || "";

  if (raw.startsWith("<iframe")) {
    const container = document.createElement("div");
    container.className = "embed-frame-container";
    container.innerHTML = raw;
    item.appendChild(container);
  } else if (raw) {
    const link = document.createElement("a");
    link.href = raw;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open on streaming service";
    item.appendChild(link);
  }

  embedList.appendChild(item);
}

// Load existing embeds for this artist
async function loadEmbeds(uid) {
  if (!embedList) return;
  embedList.innerHTML = "";

  try {
    const embedsRef = collection(db, "users", uid, "embeds");
    const q = query(embedsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    snap.forEach((docSnap) => {
      renderEmbed(docSnap.id, docSnap.data());
    });
  } catch (err) {
    console.error("[artist-dashboard] failed to load embeds:", err);
    if (embedError) {
      embedError.textContent = "Could not load your releases from the database.";
    }
  }
}

// Auth gate + profile load
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showState("denied");
    if (deniedMessage) {
      deniedMessage.textContent = "You must be logged in as an artist to view this page.";
    }
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      showState("denied");
      if (deniedMessage) {
        deniedMessage.textContent =
          "No profile found. Please complete signup again or contact support.";
      }
      return;
    }

    const data = snap.data();
    const isArtist = !!data.isArtist;

    if (!isArtist) {
      showState("denied");
      if (deniedMessage) {
        deniedMessage.textContent =
          "This page is only for artist accounts. You are currently registered as a fan.";
      }
      return;
    }

    // Passed all checks: show dashboard
    showState("dashboard");

    const displayName = data.displayName || user.displayName || user.email || "Artist";
    if (artistNameSpan) artistNameSpan.textContent = displayName;
    if (artistEmailSpan) artistEmailSpan.textContent = user.email || data.email || "";

    // Load existing embeds from Firestore
    await loadEmbeds(user.uid);

    // Wire up form submit now that we know uid
    if (addEmbedForm) {
      addEmbedForm.onsubmit = async (e) => {
        e.preventDefault();
        if (embedError) embedError.textContent = "";

        const title = embedTitleInput.value.trim();
        const raw = embedCodeInput.value.trim();

        if (!title || !raw) {
          if (embedError) {
            embedError.textContent = "Please provide a title and embed code or URL.";
          }
          return;
        }

        try {
          const embedsRef = collection(db, "users", user.uid, "embeds");
          const docRef = await addDoc(embedsRef, {
            title,
            raw,
            createdAt: new Date().toISOString(),
          });

          renderEmbed(docRef.id, { title, raw });
          embedTitleInput.value = "";
          embedCodeInput.value = "";
        } catch (err) {
          console.error("[artist-dashboard] failed to save embed:", err);
          if (embedError) {
            embedError.textContent = "Could not save this release to the database.";
          }
        }
      };
    }
  } catch (err) {
    console.error("[artist-dashboard] error loading profile:", err);
    showState("denied");
    if (deniedMessage) {
      deniedMessage.textContent =
        "There was a problem loading your artist profile. Please try again.";
    }
  }
});
