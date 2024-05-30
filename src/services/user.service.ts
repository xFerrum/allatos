import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable, inject } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { PopUpService } from "./popup.service";
import { User } from "src/models/user";
import { Notification } from "src/models/notification";
import { CreatureService } from "./creature.service";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const auth = getAuth();

@Injectable({
  providedIn: 'root',
})

export class UserService
{
  userUnsub: any;

  constructor(private router: Router, private popUpService: PopUpService, private creatureService: CreatureService)
  {
    onAuthStateChanged(auth, async (user) =>
    {
      if (user)
      {
        const userData = await this.getUser(user.uid);
        await this.popUpService.loadNotifications(userData.notifications);
        this.clearNotifications();

        this.userUnsub = onSnapshot(doc(db, "users", user.uid), (doc) =>
        {
          if (doc.exists())
          {
            let notis = this.convertNotifications(doc.data()["notifications"]);
            this.popUpService.loadNotifications(notis);
            this.clearNotifications();
          }
        });
      }
      else
      {
        this.popUpService.clearNotifications();
        if(this.userUnsub) this.userUnsub();
        if(this.creatureService.crUnsub) this.creatureService.crUnsub();
      }
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
    if (notis) this.convertNotifications(notis);
    else notis = [];

    return new User(uid, data["email"], data["username"], notis, data["ownedCreatures"]);
  }

  convertNotifications(arr: any): Array<Notification>
  {
    for (let n of arr)
    {
      n.date = n.date.toDate();
    }

    return arr;
  }

  getLoggedInID(): string
  {
    return auth.currentUser!.uid;
  }

  async clearNotifications()
  {
    await updateDoc(doc(db, "users", this.getLoggedInID()),
    {
      notifications: []
    });
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