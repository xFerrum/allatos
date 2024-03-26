import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from "firebase/firestore/lite";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Injectable } from "@angular/core";
import { Skill } from "src/classes/skill";
import { io } from 'socket.io-client';
import { Creature } from "src/classes/creature";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class BattleService
{
  socket: any;
  //TODO: validate creature id belongs to user
  //connect to socket, then room with the user's details
  //in the future the battle matchups will be created on the server side, then it will be stored on firebase (the 2 player ids and the 2 creature ids and room/battle id) this func will use those
  async joinBattle(roomID: string, cr: Creature, uid: string)
  {
    this.socket = io('http://localhost:3000');
    await this.socket.on('connect', async () =>
    {
      console.log("Connected with id:" + this.socket.id);
      await this.socket.emit('join-room', roomID, (joinSuccessful: boolean) => {
        if (joinSuccessful)
        {
          console.log("Joined room " + roomID);
          localStorage.setItem('isInBattle', 'true'); //TODO: navigate user to battle page by default if isInBattle
        }
      });
    });

    return true;
  }
}
