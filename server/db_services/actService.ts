import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc} from 'firebase/firestore/lite';
import { firebaseConfig } from "../../src/app/fbaseconfig";
import { Activity } from "../models/activity";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

export class ActService
{
  async getAct(name: string, tries = 10): Promise<Activity>
  {
    try
    {
      let docu = await getDoc(doc(db, "activities", name));
      return(new Activity(docu.id, docu.data()!["description"], docu.data()!["duration"], docu.data()!["props"]));
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
    const snapshot = await getDocs(collection(db, 'creatures'));
    const arr: Array<Activity> = [];
    snapshot.forEach((doc) =>
    {
      let data = doc.data();
      arr.push(new Activity(doc.id, data['description'], data['duration'], data["props"]));
    });

    return arr;
  }

  async createAct(name: string, description: string, duration: number, props: Object)
  {
    await setDoc(doc(db, "activities", name),
    {
      description: description,
      duration: duration,
      props: props,
    });
  }
}