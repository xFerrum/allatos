import { Creature } from "../models/creature";
import { ModifyCreature } from "./modifyCreature";
import { Notification } from "../models/notification";
import { generateSkill } from "./skillGenerator";
import { CrService } from "../db_services/crService";
import { Activity } from "../models/activity";

/*
    for now you get xp | traits | skills from activities
    - Longer activity -> more rewards
    - Guaranteed XP, influenced by int (between 1x and 2x modifier)
    - Can get/choose skill or trait (somewhat rare)
    - Can succeed/fail on attribute checks in events for extra/less rewards
    - Chance of some events happening is based on cr attributes
    - (will implement in future: item loot)
    - ("choose your own" style events?)
    - rerolls: players can acquire rerolls, use them for event skill check rr, skillpick rr etc.
*/

const modifyCreature = new ModifyCreature;
const crService = new CrService;


//modify cr and return a notification
export async function resolveAct(cr: Creature, act: Activity): Promise<Notification>
{
    let notiDescription = '';

    //TODO: randomly modify props

    if (act.props['xp'])
    {
        const rolledXP = rollXP(cr.int, act.props['xp']);
        cr = modifyCreature.addXP(cr, rolledXP);
        notiDescription += "Gained " + rolledXP + " xp.\n";
    }

    //[ how many, rarity ]
    if (act.props['skill'])
    {
        let skillPick = [];
        for (let i = 0; i < act.props['skill'][0]; i++)
        {
            const rand = Math.floor(Math.random()*2);
            let type = 'attack';
            if (rand >= 1) type = 'block'; 

            skillPick.push(generateSkill(act.props['skill'][1], type));
        }
        cr = modifyCreature.addSkillPick(cr, skillPick);
        notiDescription += "You can learn a skill! ";
    }

    if (act.props['trait'])
    {

        cr.traits.push(await crService.getTrait(act.props['trait']));
        notiDescription += "Gained a trait: " + act.props['trait']  + ". ";
    }

    return new Notification(cr.name + " back from " + act.name, notiDescription, 'activity-summary', new Date());
}

//give random number multiplied by between ~1 and ~2 (influenced by int stat)
function rollXP(int: number, baseXP: number): number
{
    let rand = Math.random()*20;
    let modi = 0;
    
    if (rand >= 10)
    {
        modi = rand - Math.pow(rand-10,  1 - (0.06 * int));
    }
    else
    {
        modi = rand + Math.pow(10 - rand,  0.06 * int);
    }

    return (Math.floor((modi/20 + 1) * baseXP));
}


function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}