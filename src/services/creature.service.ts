import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc, onSnapshot} from 'firebase/firestore';
import { Injectable } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Skill } from "src/models/skill";
import { Creature } from "src/models/creature";
import { Trait } from "src/models/trait";
import { Activity } from "src/models/activity";
import { User } from "src/models/user";
import { applyTraits } from "./applyTraits";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class CreatureService
{
  crUnsub: any;

  constructor() {}

  async getCreatureById(id: string, tries = 10): Promise<Creature>
  {
    try
    {
      let data = (await getDoc(doc(db, "creatures", id))).data();
      let creature = this.convertDataToCreature(id, data);
      return(creature);
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getCreatureById(id, tries-1)
      }
      else throw error;
    }
  }

  async initCreatures(localArr: Array<Creature>, user: User)
  {
    //add to array and set listeners for creature data changes
    for (let i = 0; i < user.ownedCreatures.length; i++)
    {
      const crID = user.ownedCreatures[i];
      localArr.push(await this.getCreatureById(crID));
      this.crUnsub = onSnapshot(doc(db, "creatures", crID), (doc) =>
      {
        if (doc.exists())
        {
          localArr[i] = this.convertDataToCreature(crID, doc.data(), false);
        }
        else delete localArr[i];
      });
    }
  }

  //convert from firebase model to frontend model, apply traits if requested
  convertDataToCreature(crID: string, data: any, baseStats = true): Creature
  {
    let cAct = undefined;
    if (data["currentAct"])
    {
      cAct = new Activity(data['currentAct'].name, data['currentAct'].description, data['currentAct'].duration, new Date(data["currentAct"].startDate.toDate()));
    }

    let cr = new Creature(crID, data["name"], data["type"], data["str"], data["agi"], data["int"], data["con"], data["ini"],
      data["ownedBy"], data["skills"], data["traits"], data["stamina"], data["xp"], new Date(data["born"].seconds*1000), data["level"], data["skillPicks"], data["lvlup"], cAct);
    if (!baseStats) applyTraits(cr);
    
    return cr;
  }
}