import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBUHTNuZF9coNJqHiw2jpVjirNLOg8_rKI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studysphere-cm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studysphere-cm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studysphere-cm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "858738178810",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:858738178810:web:4d2569b70c02b772202743",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GRKWLPSFJ8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { User };
