// assets/js/artist.js
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
} from "./firebase-config.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const loadingSection = document.getElementById("artist-loading");
const notFoundSection = document.getElementById("artist-not-found");
const notFoundMsg = document.getElementById("artist-not-found-message");
const profileSection = document.getElementById("artist-profile");

const avatarEl = document.getElementById("artist-avatar");
const nameEl = document.getElementById("artist-name");
const followersEl = document.getElementById("artist-followers");
const aboutEl = document.getElementById("artist-about");
const releasesEl = document.getElementById("artist-releases");
const followBtn = document.getElementById("follow-btn");

function showLoading() {
  loadingSection.style.display = "block";
  notFoundSection.style.display = "none";
  profileSection.style.display = "none";
}

function showNotFound(message) {
  loadingSection.style.display = "none";
  profileSection.style.display = "none";
  notFoundSection.style.display = "block";
  if (notFoundMsg && message) notFoundMsg.textContent = message;
}

function showProfile() {
  loadingSection.style.display = "none";
  notFoundSection.style.display = "none";
  profileSection.style.display = "block";
}

const params = new URLSearchParams(window.location.search);
const artistUid = params.get("uid");

if (!artistUid) {
  showNotFound("No artist id found in the URL.");
  throw new Error("[artist] missing uid query parameter");
}

// render a single release
function renderRelease(data) {
  const item = document.createElement("div");
  item.className = "embed-item";

  const title = document.createElement("h3");
  title.textContent = data.title || "Untitled release";
  item.appendChild(title);

  // optional cover image
  if (data.imageUrl) {
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = `${data.title || "Cover"} artwork`;
    img.style.maxWidth = "180px";
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

  releasesEl.appendChild(item);
}

// load releases from Firestore
async function loadReleases() {
  releasesEl.innerHTML = "";
  const embedsRef = collection(db, "users", artistUid, "embeds");
  const snap = await getDocs(embedsRef);

  if (snap.empty) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No releases yet.";
    releasesEl.appendChild(p);
    return;
  }

  snap.forEach((docSnap) => {
    renderRelease(docSnap.data());
  });
}

let currentFollowers = 0;

// load artist profile
async function loadArtistProfile() {
  showLoading();
  try {
    const ref = doc(db, "users", artistUid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      showNotFound("This artist profile does not exist.");
      return;
    }

    const data = snap.data();
    if (!data.isArtist) {
      showNotFound("This user is not an artist.");
      return;
    }

    const displayName = data.displayName || data.email || "Artist";
    const followers = data.followers || 0;
    const bio = data.bio || "No bio available.";

    currentFollowers = followers;

    if (nameEl) nameEl.textContent = displayName;
    if (aboutEl) aboutEl.textContent = bio;
    if (followersEl) {
      followersEl.textContent =
        followers === 1 ? "1 follower" : `${followers} followers`;
    }
    if (avatarEl) {
      avatarEl.textContent = displayName.charAt(0).toUpperCase();
      avatarEl.className = "artist-avatar";
    }

    await loadReleases();
    showProfile();
  } catch (err) {
    console.error("[artist] failed to load artist profile:", err);
    showNotFound("Error loading artist profile.");
  }
}

loadArtistProfile();

// follow / unfollow logic
async function isFollowing(fanUid) {
  const ref = doc(db, "users", fanUid, "follows", artistUid);
  const snap = await getDoc(ref);
  return snap.exists();
}

async function setFollowersCount(newCount) {
  currentFollowers = newCount;
  if (followersEl) {
    followersEl.textContent =
      newCount === 1 ? "1 follower" : `${newCount} followers`;
  }
  await setDoc(
    doc(db, "users", artistUid),
    { followers: newCount },
    { merge: true }
  );
}

async function follow(fanUid) {
  await setDoc(
    doc(db, "users", fanUid, "follows", artistUid),
    { followedAt: new Date().toISOString() },
    { merge: true }
  );
  await setFollowersCount((currentFollowers || 0) + 1);
}

async function unfollow(fanUid) {
  await deleteDoc(doc(db, "users", fanUid, "follows", artistUid));
  await setFollowersCount(Math.max(0, (currentFollowers || 1) - 1));
}

onAuthStateChanged(auth, async (user) => {
  if (!followBtn) return;

  if (!user) {
    followBtn.textContent = "Log in to follow";
    followBtn.classList.remove("following");
    followBtn.onclick = () => {
      window.location.href = "login.html";
    };
    return;
  }

  const fanUid = user.uid;
  try {
    const following = await isFollowing(fanUid);
    if (following) {
      followBtn.textContent = "Following";
      followBtn.classList.add("following");
    } else {
      followBtn.textContent = "Follow";
      followBtn.classList.remove("following");
    }

    followBtn.onclick = async () => {
      try {
        const isNowFollowing = await isFollowing(fanUid);
        if (isNowFollowing) {
          await unfollow(fanUid);
          followBtn.textContent = "Follow";
          followBtn.classList.remove("following");
        } else {
          await follow(fanUid);
          followBtn.textContent = "Following";
          followBtn.classList.add("following");
        }
      } catch (err) {
        console.error("[artist] follow/unfollow failed:", err);
      }
    };
  } catch (err) {
    console.error("[artist] failed to determine follow state:", err);
    followBtn.textContent = "Follow";
  }
});
