import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from "firebase/firestore/lite";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig } from "src/app/fbaseconfig";
import { Injectable } from "@angular/core";
import { Skill } from "src/classes/skill";
import { io } from 'socket.io-client';

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const socket = io('http://localhost:3000');

@Injectable({
  providedIn: 'root',
})

export class BattleService
{

}
