import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore/lite';
import { firebaseConfig } from "../../src/app/fbaseconfig";
import { Skill } from "../../src/classes/skill";
import { Creature } from "../../src/classes/creature";
import { Trait } from "../../src/classes/trait";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

export class CrService
{
  async getCreatureById(id: string, tries = 10): Promise<Creature>
  {
    try
    {
      let data = (await getDoc(doc(db, "creatures", id))).data();
      let creature = new Creature(id, data!["name"], data!["type"], data!["str"], data!["agi"], data!["int"], data!["con"],
        data!["ini"], data!["ownedBy"], data!["skills"], data!["traits"], data!["stamina"], data!["xp"], new Date(data!["born"].seconds*1000));
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
      arr.push(new Creature(doc.id, doc.data()["name"],doc.data()["type"], doc.data()["str"], doc.data()["agi"], doc.data()["int"], doc.data()["con"],
        doc.data()["ini"], doc.data()["ownedBy"], doc.data()["skills"], doc.data()["traits"], doc.data()["stamina"], doc.data()["xp"], new Date(doc.data()["born"].seconds*1000)));
    });

    return arr;
  }

  async learnSkill(crID: string, skill: Skill)
  {
    let temp = (await this.getCreatureById(crID)).skills;
    if (!temp) temp = [];
    temp.push(skill);
    delete skill.usedByID;

    const converted = temp.map((obj)=> {return Object.assign({}, obj)});
    console.log(converted);
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
    console.log(temp);

    if (!temp) temp = [];
    temp.push(trait);
    console.log(temp);

    const converted = temp.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "creatures", crID),
    {
      traits: converted
    });
  }

}