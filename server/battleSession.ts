import { Creature } from "src/classes/creature";
import { Skill } from "src/classes/skill";

export class BattleSession
{
    p1cr!: Creature;
    p2cr!: Creature;

    constructor(p1cr: Creature, p2cr: Creature)
    {
        this.p1cr = p1cr;
        this.p2cr = p2cr;
    }
}