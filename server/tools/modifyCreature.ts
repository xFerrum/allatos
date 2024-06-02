import { Creature } from "../models/creature";

export class ModifyCreature
{
    addXP(cr: Creature, gained: number): Creature
    {
        if (cr.xp + gained < 100)
        {
            cr.xp += gained;
        }
        else
        {
            cr.level++;
            cr.xp = 0 + (cr.xp + gained - 100);
        }

        return cr;
    }
}


