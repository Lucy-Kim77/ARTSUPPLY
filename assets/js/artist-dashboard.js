// assets/js/artist-dashboard.js
import {
  auth,
  db,
  storage,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "./firebase-config.js";

const loadingSection = document.getElementById("artist-loading");
const deniedSection = document.getElementById("artist-denied");
const deniedMessage = document.getElementById("artist-denied-message");
const dashboardSection = document.getElementById("artist-dashboard");

const artistNameSpan = document.getElementById("artist-name");
const artistEmailSpan = document.getElementById("artist-email");

const statReleases = document.getElementById("stat-releases");
const statFollowers = document.getElementById("stat-followers");

const addEmbedForm = document.getElementById("add-embed-form");
const embedTitleInput = document.getElementById("embed-title");
const embedCodeInput = document.getElementById("embed-code");
const audioFileInput = document.getElementById("audio-file");
const imageFileInput = document.getElementById("image-file");
const embedError = document.getElementById("embed-error");
const embedStatus = document.getElementById("embed-status");
const embedSubmitBtn = document.getElementById("embed-submit-btn");
const embedList = document.getElementById("embed-list");

let currentUser = null;

function showState(state) {
  if (loadingSection) loadingSection.style.display = state === "loading" ? "block" : "none";
  if (deniedSection) deniedSection.style.display = state === "denied" ? "block" : "none";
  if (dashboardSection) dashboardSection.style.display = state === "dashboard" ? "block" : "none";
}

// ---------- Render helpers ----------

function renderEmbed(docId, data) {
  if (!embedList) return;

  const item = document.createElement("div");
  item.className = "embed-item";
  item.dataset.id = docId;

  const title = document.createElement("h3");
  title.textContent = data.title || "Untitled release";
  item.appendChild(title);

  // Optional cover image
  if (data.imageUrl) {
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = `${data.title || "Cover"} artwork`;
    img.style.maxWidth = "140px";
    img.style.borderRadius = "12px";
    img.style.display = "block";
    img.style.marginBottom = "8px";
    item.appendChild(img);
  }

  const raw = data.raw || "";
  const audioUrl = data.audioUrl || "";

  if (raw && raw.startsWith("<iframe")) {
    const container = document.createElement("div");
    container.innerHTML = raw;
    item.appendChild(container);
  } else if (audioUrl) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioUrl;
    audio.style.width = "100%";
    item.appendChild(audio);
  } else if (raw) {
    const link = document.createElement("a");
    link.href = raw;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open externally";
    item.appendChild(link);
  } else {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No playback source attached.";
    item.appendChild(p);
  }

  embedList.appendChild(item);
}

async function loadEmbeds(uid) {
  if (!embedList) return;
  embedList.innerHTML = "";

  try {
    const embedsRef = collection(db, "users", uid, "embeds");
    const q = query(embedsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    let count = 0;
    snap.forEach((docSnap) => {
      renderEmbed(docSnap.id, docSnap.data());
      count += 1;
    });

    if (statReleases) statReleases.textContent = String(count);
  } catch (err) {
    console.error("[artist-dashboard] failed to load embeds:", err);
    if (embedError) embedError.textContent = "Could not load your releases from the database.";
  }
}

// ---------- Auth gate ----------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showState("denied");
    if (deniedMessage) {
      deniedMessage.textContent = "You must be logged in as an artist to view this page.";
    }
    return;
  }

  currentUser = user;

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

    showState("dashboard");

    const displayName = data.displayName || user.displayName || user.email || "Artist";
    if (artistNameSpan) artistNameSpan.textContent = displayName;
    if (artistEmailSpan) artistEmailSpan.textContent = user.email || data.email || "";

    if (statFollowers) {
      const followers = data.followers || 0;
      statFollowers.textContent = String(followers);
    }

    await loadEmbeds(user.uid);

    // Wire form submits now that we know the uid
    if (addEmbedForm) {
      addEmbedForm.onsubmit = handleSubmitRelease;
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

// ---------- Upload + save release ----------

async function uploadFileIfPresent(file, pathPrefix) {
  if (!file) return null;
  if (!currentUser) throw new Error("No authenticated user for upload.");

  const safeName = file.name.replace(/\s+/g, "_");
  const fullPath = `${pathPrefix}/${Date.now()}_${safeName}`;
  const ref = storageRef(storage, fullPath);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref, file);
    task.on(
      "state_changed",
      null,
      (err) => reject(err),
      () => resolve()
    );
  });

  const url = await getDownloadURL(ref);
  return url;
}

async function handleSubmitRelease(e) {
  e.preventDefault();
  if (!currentUser) return;

  if (embedError) embedError.textContent = "";
  if (embedStatus) embedStatus.textContent = "";

  const title = embedTitleInput.value.trim();
  const raw = embedCodeInput.value.trim();
  const audioFile = audioFileInput.files[0];
  const imageFile = imageFileInput.files[0];

  if (!title) {
    if (embedError) embedError.textContent = "Please provide a title for your release.";
    return;
  }

  if (!raw && !audioFile) {
    if (embedError) {
      embedError.textContent =
        "Add at least an audio file or an external embed / URL.";
    }
    return;
  }

  try {
    if (embedSubmitBtn) {
      embedSubmitBtn.disabled = true;
      embedSubmitBtn.textContent = "Uploading…";
    }
    if (embedStatus) embedStatus.textContent = "Uploading files…";

    let audioUrl = null;
    let imageUrl = null;

    if (audioFile) {
      audioUrl = await uploadFileIfPresent(
        audioFile,
        `artists/${currentUser.uid}/audio`
      );
    }

    if (imageFile) {
      imageUrl = await uploadFileIfPresent(
        imageFile,
        `artists/${currentUser.uid}/images`
      );
    }

    if (embedStatus) embedStatus.textContent = "Saving release…";

    const embedsRef = collection(db, "users", currentUser.uid, "embeds");
    const payload = {
      title,
      createdAt: new Date().toISOString(),
    };

    if (raw) payload.raw = raw;
    if (audioUrl) payload.audioUrl = audioUrl;
    if (imageUrl) payload.imageUrl = imageUrl;

    const docRef = await addDoc(embedsRef, payload);

    // Update UI
    renderEmbed(docRef.id, payload);

    // Clear form
    embedTitleInput.value = "";
    embedCodeInput.value = "";
    if (audioFileInput) audioFileInput.value = "";
    if (imageFileInput) imageFileInput.value = "";

    // Refresh stats
    await loadEmbeds(currentUser.uid);

    if (embedStatus) embedStatus.textContent = "Release saved.";
  } catch (err) {
    console.error("[artist-dashboard] failed to save release:", err);
    if (embedError) {
      embedError.textContent = "Could not save this release. Please try again.";
    }
  } finally {
    if (embedSubmitBtn) {
      embedSubmitBtn.disabled = false;
      embedSubmitBtn.textContent = "Save release";
    }
  }
}
