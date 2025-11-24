// assets/js/auth.js
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
} from "./firebase-config.js";

export async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Important: merge so we don't overwrite role/isArtist set during signup
    await setDoc(
      ref,
      {
        email: user.email,
        displayName: user.displayName || "",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

export function initAuthHeader() {
  const loginBtn = document.querySelector("[data-auth='login']");
  const signupBtn = document.querySelector("[data-auth='signup']");
  const userMenu = document.querySelector("[data-auth='user-menu']");
  const userEmailSpan = document.querySelector("[data-auth='user-email']");
  const logoutLink = document.querySelector("[data-auth='logout']");
  const artistLink = document.querySelector("[data-auth='artist-link']");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await ensureUserProfile(user);

      // Default header states
      if (loginBtn) loginBtn.style.display = "none";
      if (signupBtn) signupBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "inline-flex";
      if (userEmailSpan) userEmailSpan.textContent = user.email || "";

      // Check if user is artist to toggle artist dashboard link
      if (artistLink) {
        try {
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          const data = snap.exists() ? snap.data() : {};
          const isArtist = !!data.isArtist;
          artistLink.style.display = isArtist ? "inline-flex" : "none";
        } catch (err) {
          console.error("[auth] failed to read user profile for artist link:", err);
          artistLink.style.display = "none";
        }
      }
    } else {
      if (loginBtn) loginBtn.style.display = "inline-flex";
      if (signupBtn) signupBtn.style.display = "inline-flex";
      if (userMenu) userMenu.style.display = "none";
      if (userEmailSpan) userEmailSpan.textContent = "";
      if (artistLink) artistLink.style.display = "none";
    }
  });

  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = "index.html";
    });
  }
}
