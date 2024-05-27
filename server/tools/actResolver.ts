import { Creature } from "../../src/classes/creature";
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

export function actResolver(cr: Creature, act: Activity)
{
    
}
