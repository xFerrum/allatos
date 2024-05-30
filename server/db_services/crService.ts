import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc, deleteField} from 'firebase/firestore/lite';
import { firebaseConfig } from "../../src/app/fbaseconfig";
import { Skill } from "../../src/models/skill";
import { Creature } from "../../src/models/creature";
import { Trait } from "../../src/models/trait";
import { Activity } from "../models/activity";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

export class CrService
{
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

  async getAllCreatures(): Promise<Array<Creature>>
  {
    const snapshot = await getDocs(collection(db, 'creatures'));
    const arr: Array<Creature> = [];
    snapshot.forEach((doc) =>
    {
      let data = doc.data();
      arr.push(this.convertDataToCreature(doc.id, data));
    });

    return arr;
  }

  //DOES NOT UPDATE: currentAct, ownedBy, type
  async updateCreature(crID: string, cr: Creature)
  {
    for (let s of cr.skills)
    {
      delete s.usedByID;
    }
    const skillsConverted = cr.skills.map((obj)=> {return Object.assign({}, obj)});
    const traitsConverted = cr.traits.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "creatures", crID),
    {
      agi: cr.agi,
      born: cr.born,
      con: cr.con,
      ini: cr.ini,
      int: cr.int,
      level: cr.level,
      name: cr.name,
      skills: skillsConverted,
      stamina: cr.stamina,
      str: cr.str,
      traits: traitsConverted,
      xp: cr.xp,
    });
  }

  async learnSkill(crID: string, skill: Skill)
  {
    let temp = (await this.getCreatureById(crID)).skills;
    if (!temp) temp = [];
    temp.push(skill);
    delete skill.usedByID;
    const converted = temp.map((obj)=> {return Object.assign({}, obj)});
    
    await updateDoc(doc(db, "creatures", crID),
    {
      skills: converted
    });
  }

  async deleteAllSkills(cid: string)
  {
    await updateDoc(doc(db, "creatures", cid),
    {
      skills: []
    });
  }

  async addTrait(crID: string, trait: Trait)
  {
    let temp = (await this.getCreatureById(crID)).traits;
    if (!temp) temp = [];
    temp.push(trait);
    const converted = temp.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "creatures", crID),
    {
      traits: converted
    });
  }

  async setAct(crID: string, act: Activity = null)
  {
    await updateDoc(doc(db, "creatures", crID),
    {
      currentAct: act
    });
  }

  async addSkillPick(crID: string, arr: Array<Skill>)
  {
    let temp = (await this.getCreatureById(crID)).skillPicks;
    if (!temp) temp = {};
    arr = arr.map((obj)=> {return Object.assign({}, obj)});
    temp[(new Date().getTime())] = arr;

    await updateDoc(doc(db, "creatures", crID),
    {
      skillPicks: temp
    });
  }

  async replaceSkillPicks(crID: string, skillPicks: Object)
  {
    for (let arr in skillPicks)
    {
      skillPicks[arr] = skillPicks[arr].map((obj)=> {return Object.assign({}, obj)});
    }

    if (Object.keys(skillPicks).length === 0)
    {
      await updateDoc(doc(db, "creatures", crID),
      {
        skillPicks: deleteField()
      });
    }
    else await updateDoc(doc(db, "creatures", crID),
    {
      skillPicks: skillPicks
    });
  }

  convertDataToCreature(crID: string, data: any): Creature
  {
    let cAct = undefined;
    if (data["currentAct"])
    {
      cAct = new Activity(data["currentAct"].name, data["currentAct"].duration);
      cAct.startDate = new Date(data["currentAct"].startDate);
    }

    return new Creature(crID, data["name"], data["type"], data["str"], data["agi"], data["int"], data["con"], data["ini"],
      data["ownedBy"], data["skills"], data["traits"], data["stamina"], data["xp"], new Date(data["born"].seconds*1000), data["level"], data["skillPicks"], cAct);
  }
}