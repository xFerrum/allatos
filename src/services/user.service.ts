import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const firebaseConfig =
{
    apiKey: "AIzaSyDznj0v_MEedP9vHiBHO7b468vlgaTN_48",
    authDomain: "allatos.firebaseapp.com",
    projectId: "allatos",
    storageBucket: "allatos.appspot.com",
    messagingSenderId: "766649715660",
    appId: "1:766649715660:web:807d199ef4f3ffe1c36b69",
    measurementId: "G-QHW9VJRNGC"
  };
  
  const fbase = initializeApp(firebaseConfig);
  const db = getFirestore(fbase);

export class UserService
{
    getFbaseConfig() { return firebaseConfig };
}