import { Creature } from "./creature";
import { Notification } from "./notification";

export class User
{
    uid: string;
    email: string;
    username: string;
    notifications: Array<Notification>;
    ownedCreatures: Array<Creature>;

    constructor(uid: string, email: string, username: string, notifications: Array<Notification>, ownedCreatures: Array<Creature>)
    {
        this.uid = uid;
        this.email = email;
        this.username = username;
        this.notifications = notifications;
        this.ownedCreatures = ownedCreatures;
    }
}