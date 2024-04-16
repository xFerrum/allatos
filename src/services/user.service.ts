import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc } from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
  
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

  isLoggedIn(): boolean
  {
    if (localStorage.getItem("loggedInID") == null)
    {
      return false;
    }
    else return true;
  }

  async getUserDetails(uid: string, tries = 10): Promise<any>
  {
    try
    {
      let data = await getDoc(doc(db, "users", uid));
      return(data.data());
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getUserDetails(uid, tries-1)
      }
      else throw error;
    }
  }
}