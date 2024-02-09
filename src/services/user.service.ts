import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc } from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable } from "@angular/core";

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
  const auth = getAuth();

  @Injectable({
    providedIn: 'root',
  })

export class UserService
{
  //creates Firebase user auth, adds to users collection and returns true if succesful
  registerUser(username: string, email: string, password: string)
  {
    createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) =>
    {
      await setDoc(doc(db, "users", userCredential.user.uid),
      {
        email: email,
        password: password,
        username: username
      });
      return true;
    })
  .catch((error) =>
  {
    console.error(error.code + ": " + error.message);
    return false;
  });
  }

  //returns firebase auth uid if successful
  async logUserIn(email: string, password: string)
  {
    let uid = await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) =>
      {
        localStorage.setItem("loggedInID", userCredential.user.uid);
        return userCredential.user.uid;
      })
      .catch((error) =>
      {
        console.error(error.code + ": " + error.message);
        return false;
      }); 
      return uid;
  }

  async signUserOut()
  {
    let result = await signOut(auth).then(() =>
    {
      localStorage.removeItem("loggedInID");
      return true;
    }).catch((error) =>
    {
      console.error(error.code + ": " + error.message);
      return false;
    });
    
    return result;
  }

  async getUserDetails(uid: string)
  {
    let data = await getDoc(doc(db, "users", uid));
    return(data.data());
  }
}