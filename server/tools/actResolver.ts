import { Creature } from "../../src/models/creature";
import { ModifyCreature } from "./modifyCreature";
import { Notification } from "../models/notification";
import { generateSkill } from "./skillGenerator";
import { CrService } from "../db_services/crService";

/*
    for now you get xp | traits | skills from activities
    - Longer activity -> more rewards
    - Guaranteed XP
    - Can get/choose skill or trait (somewhat rare)
    - Can succeed/fail on attribute checks in events for extra/less rewards
    - Chance of some events happening is based on cr attributes
    - (will implement in future: item loot)
    - ("choose your own" style events?)
*/

const modifyCreature = new ModifyCreature;
const crService = new CrService;


//modify cr and return a notification
export function resolveAct(cr: Creature, actName: string): Notification
{
    let actObj = selectAct(actName);
    let notiDescription = '';

    if (actObj.hasOwnProperty('xp'))
    {
        cr = modifyCreature.addXP(cr, actObj['xp']);
        notiDescription += "Gained " + actObj['xp'] + " xp. ";
    }

    if (actObj.hasOwnProperty('skill'))
    {
        let skillPick = [];
        for (let i = 0; i < actObj['skill'][0]; i++)
        {
            const rand = Math.floor(Math.random()*2);
            let type = 'attack';
            if (rand >= 1) type = 'block'; 

            skillPick.push(generateSkill(actObj['skill'][1], type));
        }
        crService.addSkillPick(cr.crID, skillPick);
        notiDescription += "You can learn a skill! ";
    }

    return new Notification(cr.name + " back from " + actName, notiDescription, 'activity-summary', new Date());
}

//skill reward: [how many to pick from] [rarity]
function selectAct(actName: string): Object
{
    switch (actName)
    {
        case 'Galand':
            return({
               xp: 3,
               skill: [3, 1]
            });
    
        case 'Kaland':
            return({
                xp: 16 
            });

        default:
            return null;
    }
}