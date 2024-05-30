import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, updateDoc } from 'firebase/firestore/lite';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Injectable, inject } from "@angular/core";
import { firebaseConfig } from "../../src/app/fbaseconfig";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { User } from "../models/user";
import { Notification } from "../models/notification";
import { Skill } from "../models/skill";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const auth = getAuth();

export class UserService
{
  constructor() {}

  async getUser(uid: string, tries = 10): Promise<any>
  {
    try
    {
      let data = (await getDoc(doc(db, "users", uid))).data();
      return(this.convertDataToUser(uid, data));
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getUser(uid, tries-1)
      }
      else throw error;
    }
  }

  async sendNotification(uid: string, noti: Notification)
  {
    let temp = (await this.getUser(uid)).notifications;
    console.log(temp);
    if (!temp) temp = [];
    temp.push(noti);
    const converted = temp.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "users", uid),
    {
      notifications: converted
    });
  }

  convertDataToUser(uid: string, data: any): User
  {
    return new User(uid, data["email"], data["username"], data["notifications"], data["ownedCreatures"]);
  }
}