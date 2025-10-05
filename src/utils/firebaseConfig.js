// Firebase configuration for NEO-Orrery
// This file sets up Firebase for real-time notification sharing between web and mobile

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1f83qkhr3-OWeSeuuLDHXWiXBhDI-TPc",
  authDomain: "neoguardian-dee0c.firebaseapp.com",
  databaseURL: "https://neoguardian-dee0c-default-rtdb.firebaseio.com",
  projectId: "neoguardian-dee0c",
  storageBucket: "neoguardian-dee0c.firebasestorage.app",
  messagingSenderId: "968409208507",
  appId: "1:968409208507:web:dce629359f6bd08af6fb9e",
  measurementId: "G-XHP95RTZ06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, app };