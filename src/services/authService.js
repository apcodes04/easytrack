// src/services/authService.js
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'

// ─── Google Sign-In ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result   = await signInWithPopup(auth, provider)
  await ensureUserDoc(result.user)
  return result.user
}

// ─── Phone Auth ───────────────────────────────────────────────────────────────
export function setupRecaptcha(containerId) {
  // Clear existing if any
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear()
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
  })
  return window.recaptchaVerifier
}

export async function sendOTP(phoneNumber) {
  // phoneNumber must be in E.164 format: +91XXXXXXXXXX
  const appVerifier = window.recaptchaVerifier
  const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
  window.confirmationResult = confirmation
  return confirmation
}

export async function verifyOTP(otp) {
  const result = await window.confirmationResult.confirm(otp)
  await ensureUserDoc(result.user)
  return result.user
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth)
}

// ─── Create user doc if first login ──────────────────────────────────────────
async function ensureUserDoc(firebaseUser) {
  const ref  = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      displayName: firebaseUser.displayName || '',
      email:       firebaseUser.email       || '',
      phone:       firebaseUser.phoneNumber || '',
      photoURL:    firebaseUser.photoURL    || '',
      createdAt:   serverTimestamp(),
    })
  }
}

// ─── Update display name ──────────────────────────────────────────────────────
export async function updateDisplayName(name) {
  await updateProfile(auth.currentUser, { displayName: name })
  await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name }, { merge: true })
}
