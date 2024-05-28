import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc } from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable, inject } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { PopUpService } from "./popup.service";
import { User } from "src/classes/user";
import { Timestamp } from "firebase/firestore/lite";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const auth = getAuth();

@Injectable({
  providedIn: 'root',
})

export class UserService
{

  constructor(private router: Router, private popUpService: PopUpService)
  {
    onAuthStateChanged(auth, async (user) =>
    {
      if (user)
      {
        const userData = await this.getUser(user.uid);
        for (let n of userData.notifications)
        {
          this.popUpService.addNotification(n);
        }

        if (this.popUpService.notifications.length > 0)
        {
          this.popUpService.showNextNotification();
        }
      }
      else this.popUpService.clearNotifications();
    });
  }
  
  //creates Firebase user auth, adds to users collection and returns true if successful
  async registerUser(username: string, email: string, password: string)
  {
    await createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) =>
    {
      await setDoc(doc(db, "users", userCredential.user.uid),
      {
        email: email,
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
    if (auth.currentUser === null)
    {
      return false;
    }
    else return true;
  }

  async getUser(uid: string, tries = 10): Promise<any>
  {
    try
    {
      let data = (await getDoc(doc(db, "users", uid))).data();
      return(this.convertDataToUser(uid, data));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getUser(uid, tries-1)
      }
      else throw error;
    }
  }

  convertDataToUser(uid: string, data: any): User
  {
    let notis = data["notifications"];
    if (notis)
    {
      for (let n of notis)
      {
        n.date = n.date.toDate();
      }
    }
    else notis = [];

    return new User(uid, data["email"], data["username"], notis, data["ownedCreatures"]);
  }

  getLoggedInID(): string | undefined
  {
    return auth.currentUser?.uid;
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean>
  {
    return new Promise((resolve) =>
    {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user)
        {
          resolve(true); // User is signed in, allow access
        } else
        { // Redirect to login if not signed in
          this.router.navigate(['']);
          resolve(false);
        }
      });
    });

  }
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> =>
{
  return inject(UserService).canActivate(next, state);
}