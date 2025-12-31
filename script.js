// ===================== FIREBASE INIT =====================
const firebaseConfig = {
  apiKey: "AIzaSyB41tS5jK6nwFoV8IIgFbIkP6Q1QSb5Uos",
  authDomain: "apppp-98a09.firebaseapp.com",
  projectId: "apppp-98a09",
  storageBucket: "apppp-98a09.firebasestorage.app",
  messagingSenderId: "294111503812",
  appId: "1:294111503812:web:0b1e2cde7d83937893f091",
  measurementId: "G-EVKCXLEQLE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// ===================== PAGE LOAD =====================
window.addEventListener("DOMContentLoaded", () => {
  const mainContainer = document.getElementById('main-container');
  const signUpToggle = document.getElementById('signUpToggle');
  const signInToggle = document.getElementById('signInToggle');

  if (mainContainer && signUpToggle && signInToggle) {
    signUpToggle.onclick = () => mainContainer.classList.add("right-panel-active");
    signInToggle.onclick = () => mainContainer.classList.remove("right-panel-active");
  }

  // Forms
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const resetForm  = document.getElementById('resetForm');

  if (signInForm) {
    signInForm.onsubmit = (e) => {
      e.preventDefault();
      auth.signInWithEmailAndPassword(
        document.getElementById('inEmail').value,
        document.getElementById('inPassword').value
      ).catch(err => alert(err.message));
    };
  }

  if (signUpForm) {
    signUpForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('upName').value;
      auth.createUserWithEmailAndPassword(
        document.getElementById('upEmail').value,
        document.getElementById('upPassword').value
      ).then(res => res.user.updateProfile({ displayName: name })
        .then(() => syncUserToFirestore(res.user))
      ).catch(err => alert(err.message));
    };
  }

  if (resetForm) {
    resetForm.onsubmit = (e) => {
      e.preventDefault();
      auth.sendPasswordResetEmail(document.getElementById('resetEmail').value)
        .then(() => { alert("Check your email!"); switchView('auth-view'); })
        .catch(err => alert(err.message));
    };
  }
});

// ===================== FIRESTORE SYNC =====================
function syncUserToFirestore(user) {
  if (!user) return;
  return db.collection("users").doc(user.uid).set({
    name: user.displayName || "New User",
    email: user.email,
    phone: user.phoneNumber || "Not provided",
    photo: user.photoURL || "",
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.error(err));
}

// ===================== AUTH STATE =====================
auth.onAuthStateChanged(user => {
  if (user) {
    const nameLabel = document.getElementById('display-name-label');
    const emailLabel = document.getElementById('user-email-display');
    if (nameLabel) nameLabel.innerText = user.displayName || "User";
    if (emailLabel) emailLabel.innerText = user.email;

    switchView('dashboard-view');
    syncUserToFirestore(user);
  } else {
    const resetView = document.getElementById('reset-view');
    if (!resetView || !resetView.classList.contains('active')) {
      switchView('auth-view');
    }
  }
});

// ===================== HELPER FUNCTIONS =====================
function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
}

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.classList.toggle('active');
}

function updateName() {
  const newName = document.getElementById('newNameInput').value;
  if (newName && auth.currentUser) {
    auth.currentUser.updateProfile({ displayName: newName }).then(() => {
      syncUserToFirestore(auth.currentUser);
      document.getElementById('display-name-label').innerText = newName;
      alert("Name Updated!");
      toggleSettings();
    });
  }
}

function logout() {
  auth.signOut();
  const panel = document.getElementById('settings-panel');
  if (panel) panel.classList.remove('active');
}

// ===================== GOOGLE LOGIN =====================
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  auth.signInWithPopup(provider)
    .then(result => syncUserToFirestore(result.user))
    .catch(err => alert(err.message));
}

// ===================== PWA SERVICE WORKER =====================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => console.log("Service Worker registered:", reg.scope))
      .catch(err => console.error("SW registration failed:", err));
  });
}

