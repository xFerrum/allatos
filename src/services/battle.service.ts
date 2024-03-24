import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from "firebase/firestore/lite";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Injectable } from "@angular/core";
import { Skill } from "src/classes/skill";
import { io } from 'socket.io-client';

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

@Injectable({
  providedIn: 'root',
})

export class BattleService
{
  socket: any;

  initializeBattle(roomID: string)
  {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () =>
    {
      console.log("connected with id:" + this.socket.id);
      this.socket.emit('join-room', roomID, (joinSuccessful: boolean) => {
        if (joinSuccessful)
        {
          console.log("joined room " + roomID);
        }
      });
    });

  }
}
