import { Skill } from "../src/classes/skill";

/*
NOTES/IDEAS:
- rarity: 0-3 minor, major, pro, mythical or smth idk WIP
- attacks stronger than blocks, but fatigue significantly sooner, comboable
- blocks: less comboable, but can counter opponent's attacks, takes priority to attacks in combat
- fatigue: skills build up fatigue, have to rest after a certain amount
- diminishing returns on creature attributes (ie: 10 str -> 100% dmg , 15 str -> 120% dmg , 20 str -> 130% dmg)
*/

/*
TYPES:
- ATTACK
    base: 6-7-8-10
    keywords: shredder: block is weaker vs || heavy: builds more fatigue on opponent (but also more on you?) || combo: extra effect if previous skill was attack
- BLOCK
    base: 4-5-6-8
    keywords: stance: buff next block || retaliate: deal damage if all damage blocked (heavier fatigue cost on blocker?) || heal
- DEBUFF
    keywords: stun || poison ? || 
- BUFF
    keywords: heal
*/
export function generateSkill(rarity: number, type: string): Skill
{
    let dmg;
    let block;
    let fatCost;
    let keywords: Object;
    
    switch(type)
    {
        case 'attack':
            const dmgarr = [6, 7, 8, 10];
            dmg = dmgarr[rarity] 
            fatCost = 10;

            break;

        case 'block':
            const blockarr = [4, 4.5, 5.5, 7];
            block = blockarr[rarity];
            fatCost = 5;

            break;
    }

}