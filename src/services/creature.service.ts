import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Skill } from "src/classes/skill";
import { Creature } from "src/classes/creature";
import { Trait } from "src/classes/trait";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class CreatureService
{
  async getCreatureById(id: string, tries = 10): Promise<Creature>
  {
    try
    {
      let data = (await getDoc(doc(db, "creatures", id))).data();
      let creature = new Creature(id, data!["name"], data!["type"], data!["str"], data!["agi"], data!["int"], data!["con"], data!["ini"], data!["ownedBy"], data!["skills"], data!["traits"], data!["stamina"], data!["xp"], new Date(data!["born"].seconds*1000));
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

  async fetchSkillsOf(id: string, tries = 10): Promise<Skill[]>
  {
    try
    {
      let data = (await getDoc(doc(db, "creatures", id))).data();
      let skills = data!["skills"];
      return(skills);
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.fetchSkillsOf(id, tries-1)
      }
      else throw error;
    }
  }

  async deleteAllSkills(cid: string)
  {
    await updateDoc(doc(db, "creatures", cid),
    {
      skills: []
    });
  }

  async addTrait(cid: string, trait: Trait)
  {
    let temp = (await this.getCreatureById(cid)).traits;
    console.log(temp);

    if (!temp) temp = [];
    temp.push(trait);
    console.log(temp);

    const converted = temp.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "creatures", cid),
    {
      traits: converted
    });
  }

/*   async getCreaturesOfOwner(ownerId: string)
  {
		const q = query(collection(db, "creatures"), where("ownedBy", "==", ownerId));
		const querySnapshot = await getDocs(q);
		
		querySnapshot.forEach((doc) =>
		{
			console.log(doc.id, " => ", doc.data());
		});
	
  } */
}