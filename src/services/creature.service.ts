import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc, onSnapshot} from 'firebase/firestore';
import { Injectable } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Skill } from "src/models/skill";
import { Creature } from "src/models/creature";
import { Trait } from "src/models/trait";
import { Activity } from "src/models/activity";
import { User } from "src/models/user";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class CreatureService
{
  crUnsubs: Array<Function> = [];
  ownedCrsUnsub!: Function;
  creatures: Array<Creature> = [];

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
    localArr.length = 0;
    this.crUnsubs.forEach((uns) => uns());
    if (this.ownedCrsUnsub) this.ownedCrsUnsub();
    this.ownedCrsUnsub = onSnapshot(doc(db, "users", user.uid), (doc) =>
    {
      if (user.ownedCreatures.length !== doc.data()!["ownedCreatures"].length)
      {
        user.ownedCreatures = doc.data()!["ownedCreatures"];
        this.initCreatures(localArr, user);
      }
    });

    //add to array and set listeners for creature data changes
    for (let i = 0; i < user.ownedCreatures.length; i++)
    {
      const crID = user.ownedCreatures[i];
      localArr.push(await this.getCreatureById(crID));
      this.crUnsubs[i] = onSnapshot(doc(db, "creatures", crID), (doc) =>
      {
        if (doc.exists())
        {
          localArr[i] = this.convertDataToCreature(crID, doc.data(), false);
        }
        else
        {
          this.initCreatures(localArr, user);
        }
      });
    }

    this.creatures = localArr;
  }

  //convert from firebase model to frontend model, apply traits if requested
  convertDataToCreature(crID: string, data: any, baseStats = true): Creature
  {
    let cAct = undefined;
    if (data["currentAct"])
    {
      cAct = new Activity(data['currentAct'].name, data['currentAct'].description, data['currentAct'].duration, new Date(data["currentAct"].startDate.toDate()));
    }
    if (data["skills"])
    {
      for (let s of data["skills"])
      {

      }
    }

    const hasPicks = data["skillPicks"] ? true : false;

    let cr = new Creature(crID, data["name"], data["type"], data["str"], data["agi"], data["int"], data["con"], data["ini"],
      data["ownedBy"], data["skills"], data["traits"], data["stamina"], data["xp"], new Date(data["born"].seconds*1000), data["level"],
      hasPicks, data["lvlup"], data["battlesWon"], cAct);
    
    return cr;
  }

}