import { Creature } from "../src/classes/creature";
import { Skill } from "../src/classes/skill";

export class BattleSession
{
    roomID!: string;
    cr1!: Creature;
    cr2!: Creature;
    uid1!: string;
    uid2!: string;
    maxHP1!: number;
    maxHP2!: number;

    constructor(roomID: string, cr: Creature)
    {
        this.roomID = roomID;
        this.cr1 = cr;
        this.uid1 = cr.ownedBy;
        this.maxHP1 = cr.con;
    }

    addSecondPlayer(cr: Creature)
    {
        this.cr2 = cr;
        this.uid2 = cr.ownedBy;
        this.maxHP2 = cr.con;
    }
}