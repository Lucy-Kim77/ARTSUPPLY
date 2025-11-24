// assets/js/artist-directory.js
import {
  db,
  collection,
  getDocs,
  query,
  where,
} from "./firebase-config.js";

const loadingSection = document.getElementById("artists-loading");
const errorSection = document.getElementById("artists-error");
const errorMessage = document.getElementById("artists-error-message");
const gridSection = document.getElementById("artists-grid-section");
const grid = document.getElementById("artists-grid");
const searchInput = document.getElementById("artist-search");
const artistCountEl = document.getElementById("artist-count");

let allArtists = [];

// Render artists into the grid, with search filter
function renderArtists() {
  if (!grid) return;

  const term = (searchInput?.value || "").trim().toLowerCase();
  grid.innerHTML = "";

  const sorted = [...allArtists].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  const filtered = sorted.filter((artist) => {
    if (!term) return true;
    const name = (artist.displayName || "").toLowerCase();
    return name.includes(term);
  });

  if (artistCountEl) {
    artistCountEl.textContent =
      filtered.length === 1
        ? "1 artist"
        : `${filtered.length} artists`;
  }

  if (filtered.length === 0) {
    gridSection.style.display = "none";
    errorSection.style.display = "block";
    errorMessage.textContent = term
      ? "No artists match your search."
      : "No artists found yet.";
    return;
  }

  errorSection.style.display = "none";
  gridSection.style.display = "block";

  filtered.forEach(({ uid, displayName, followers }) => {
    const card = document.createElement("button");
    card.className = "artist-card";
    card.type = "button";
    card.onclick = () => {
      window.location.href = `artist.html?uid=${encodeURIComponent(uid)}`;
    };

    const avatar = document.createElement("div");
    avatar.className = "artist-card-avatar";
    avatar.textContent = (displayName || "?").charAt(0).toUpperCase();
    card.appendChild(avatar);

    const info = document.createElement("div");
    info.className = "artist-card-info";

    const nameEl = document.createElement("h3");
    nameEl.textContent = displayName || "Unnamed artist";
    info.appendChild(nameEl);

    const followersEl = document.createElement("p");
    followersEl.className = "muted";
    const count = followers || 0;
    followersEl.textContent =
      count === 1 ? "1 follower" : `${count} followers`;
    info.appendChild(followersEl);

    card.appendChild(info);
    grid.appendChild(card);
  });
}

async function loadArtists() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("isArtist", "==", true));
    const snap = await getDocs(q);

    console.log("[artist-directory] found", snap.size, "artist docs with isArtist == true");

    allArtists = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      allArtists.push({
        uid: docSnap.id,
        displayName: data.displayName || data.email || "Artist",
        followers: data.followers || 0,
      });
    });

    loadingSection.style.display = "none";

    if (allArtists.length === 0) {
      errorSection.style.display = "block";
      errorMessage.textContent = "No artists have signed up yet.";
      if (artistCountEl) artistCountEl.textContent = "0 artists";
      return;
    }

    renderArtists();
  } catch (err) {
    console.error("[artist-directory] failed to load artists:", err);
    loadingSection.style.display = "none";
    errorSection.style.display = "block";
    errorMessage.textContent =
      "There was a problem loading artists. Check console for details.";
  }
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderArtists();
  });
}

loadArtists();
