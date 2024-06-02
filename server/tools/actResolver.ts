import { Creature } from "../models/creature";
import { ModifyCreature } from "./modifyCreature";
import { Notification } from "../models/notification";
import { generateSkill } from "./skillGenerator";
import { CrService } from "../db_services/crService";
import { Activity } from "../models/activity";

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
export async function resolveAct(cr: Creature, act: Activity): Promise<Notification>
{
    let notiDescription = '';

    //TODO: randomly modify props

    if (act.props.hasOwnProperty('xp'))
    {
        cr = modifyCreature.addXP(cr, act.props['xp']);
        notiDescription += "Gained " + act.props['xp'] + " xp. ";
    }

    // [ how many, rarity ]
    if (act.props.hasOwnProperty('skill'))
    {
        let skillPick = [];
        for (let i = 0; i < act.props['skill'][0]; i++)
        {
            const rand = Math.floor(Math.random()*2);
            let type = 'attack';
            if (rand >= 1) type = 'block'; 

            skillPick.push(generateSkill(act.props['skill'][1], type));
        }
        crService.addSkillPick(cr.crID, skillPick);
        notiDescription += "You can learn a skill! ";
    }

    if (act.props.hasOwnProperty('trait'))
    {

        crService.addTrait(cr.crID, await crService.getTrait(act.props['trait']));
        notiDescription += "Gained a trait: " + act.props['trait']  + ". ";
    }

    return new Notification(cr.name + " back from " + act.name, notiDescription, 'activity-summary', new Date());
}