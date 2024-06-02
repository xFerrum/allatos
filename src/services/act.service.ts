import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection} from 'firebase/firestore/lite';
import { firebaseConfig } from "../app/fbaseconfig";
import { Activity } from "../models/activity";
import { Injectable } from "@angular/core";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class ActService
{
  async getAct(name: string, tries = 10): Promise<Activity>
  {
    try
    {
      let docu = await getDoc(doc(db, "activities", name));
      return(new Activity(docu.id, docu.data()!["description"], docu.data()!["duration"]));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getAct(name, tries-1)
      }
      else throw error;
    }
  }

  async getAllActs(): Promise<Array<Activity>>
  {
    const snapshot = await getDocs(collection(db, 'activities'));
    const arr: Array<Activity> = [];
    snapshot.forEach((doc) =>
    {
      let data = doc.data();
      arr.push(new Activity(doc.id, data['description'], data['duration']));
    });

    return arr;
  }
}