import { Creature } from "../models/creature";
import { Skill } from "../models/skill";

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
            cr.lvlup++;
            cr.xp = 0 + (cr.xp + gained - 100);
        }

        return cr;
    }

    addSkillPick(cr: Creature, skillPick: Array<Skill>): Creature
    {
        if (!(cr.skillPicks)) cr.skillPicks = {};
        cr.skillPicks[(new Date().getTime())] = skillPick;

        return cr;
    }
}


