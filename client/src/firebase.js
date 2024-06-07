// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "bsh-blog.firebaseapp.com",
  projectId: "bsh-blog",
  storageBucket: "bsh-blog.appspot.com",
  messagingSenderId: "1054923445263",
  appId: "1:1054923445263:web:43c81283b1962d64f7ff7a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);