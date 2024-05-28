import { Creature } from "../../src/classes/creature";
import { Activity } from "../models/activity";
import { ModifyCreature } from "./modifyCreature";
import { Notification } from "../models/notification";

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

//modify cr and return a notification
export function resolveAct(cr: Creature, actName: string): Notification
{
    let actObj = selectAct(actName);
    let notiDescription = '';

    if (actObj.hasOwnProperty('xp'))
    {
        cr = modifyCreature.addXP(cr, actObj['xp']);
        notiDescription += "Gained " + actObj['xp'] + " xp.\n";
    }

    return new Notification("Back from " + actName, notiDescription, 'activity-summary', new Date());
}

function selectAct(actName: string): Object
{
    switch (actName)
    {
        case 'Galand':
            return({
               xp: 35 
            });
    
        case 'Kaland':
            return({
                xp: 17 
            });

        default:
            return null;
    }
}