import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable } from "@angular/core";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Skill } from "src/classes/skill";
import { Creature } from "src/classes/creature";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class CreatureService
{
  async getCreatureById(id: string)
  {
    let data = (await getDoc(doc(db, "creatures", id))).data();
    let creature = new Creature(id, data!["name"], data!["type"], data!["str"], data!["agi"], data!["con"], data!["ini"], data!["ownedBy"], data!["skills"], data!["stamina"]);
    return(creature);
  }

  async learnSkill(cid: string, skill: Skill)
  {
    await updateDoc(doc(db, "creatures", cid),
      {
        skills: arrayUnion(Object.assign({}, skill))
      });
  }

  async deleteAllSkills(cid: string)
  {
    await updateDoc(doc(db, "creatures", cid),
    {
      skills: {}
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