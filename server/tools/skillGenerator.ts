import { Skill } from "../../src/models/skill";
/*
NOTES/IDEAS:
- rarity: 0-3 minor, major, pro, mythical or smth idk WIP
- attacks stronger than blocks, but fatigue significantly sooner, comboable
- blocks: less comboable, but can counter opponent's attacks, takes priority to attacks in combat
- fatigue: skills build up fatigue, have to rest after a certain amount
- diminishing returns on creature attributes (ie: 10 str -> 100% dmg , 15 str -> 120% dmg , 20 str -> 130% dmg)

- craft multiple cards of same rarity -> upgrade another card or smth
- "snap" keyword: free action (doesnt count as card played, but still has fat cost), small effect
*/

/*
TYPES:
- ATTACK
    base: 6-7-8-10
    keywords:
        shredder: remove X block from opp
        heavy: builds more fatigue on opponent (but also more on you?)
        combo: extra effect if next skill is attack too

- BLOCK
    base: 4-5-6-8
    keywords:
        stance: extra block if previous was block too
        retaliate: deal damage if opponent attacked and all damage blocked
        steadfast: keep remaining block for next turn
        heal

- DEBUFF
    keywords: stun || poison ? || 
- BUFF
    keywords: heal
*/

/*
Method of generation:
    - get the rarity and type of skill to be generated
    - add base skill properties
    - load skill (functions) of that type into "skills" array
    - choose a skill function randomly (and input rarity, so effects can be scaled accordingly), it adds/modifies the property variables
    - construct and return skill
*/

let selfTarget: boolean;
let effects = {};
let fatCost = 0;
let name: string;
let description = '';
let skills = [];

//TODO: separate functions for adding each effect, these could be used for modifying skills too (after theyve already been generated)
export function generateSkill(rarity: number, type = 'random'): Skill
{
    effects = {};
    fatCost = 0;
    skills = [];

    if (type === 'random')
    {
        const types = ['attack', 'block'];
        type = types[rndInt(0, 1)];
    }

    switch(type)
    {
        case 'attack':
            const dmgArr = [10, 11, 12, 15];
            effects['dmg'] = dmgArr[rarity] 
            fatCost = 12;
            selfTarget = false;

            loadAttacks(rarity);

            break;



        case 'block':
            const blockArr = [7, 7, 8, 10];
            effects['block'] = blockArr[rarity];
            fatCost = 3;
            selfTarget = true;

            loadBlocks(rarity);

            break;



        case 'trick':

            loadTricks(rarity);

            break;
    }

    skills[Math.floor(Math.random() * skills.length)](); //get random element
    return (new Skill(type, selfTarget, effects, fatCost, rarity, name));
}

function loadAttacks(r: number)
{
    //+4-13 dmg
    skills.push(() =>
    {
        name = "Strike";

        const x = rndInt(3, 6);
        fatCost -= 6 - x;
        const dmgArr = [1, 2, 4, 7];
        effects['dmg'] += x + dmgArr[r];
    });

    //+1-6 dmg, +6-12 heavy
    skills.push(() =>
    {
        name = "Heavy Attack";

        const x = rndInt(4, 6);
        fatCost -= 6 - x;
        const dmgArr = [1, 2, 4, 6];
        effects['dmg'] += dmgArr[r];
        const heavyArr = [2, 3, 4, 7];
        effects['heavy'] = x + heavyArr[r];
    });

    //+1-5 dmg, +4-10 shred
    skills.push(() =>
    {
        name = "Shred";

        const x = rndInt(4, 6);
        fatCost -= 6 - x;
        const dmgArr = [1, 2, 3, 5];
        effects['dmg'] += dmgArr[r];
        const shredArr = [0, 1, 2, 4];
        effects['shred'] = x + shredArr[r];
    });

    //combo: +6-16 dmg
    skills.push(() =>
    {
        name = "Twin Strike";

        fatCost += 2;
        const x = rndInt(6, 9);
        fatCost -= 9 - x;
        const comboDmgArr = [0, 2, 4, 7];
        effects['combo'] = {dmg: x + comboDmgArr[r]};
    });

    //combo: +9-19 heavy
    skills.push(() =>
    {
        name = "Overwhelm";

        const x = rndInt(9, 12);
        fatCost -= 12 - x;
        const comboFatArr = [0, 2, 4, 7];
        effects['combo'] = {heavy: x + comboFatArr[r]};
    });

    if (r === 1)
    {
        skills.push(() =>
        {
            //deal damage equal to block
            name = "Body Slam";
    
            fatCost += 2;
            effects['dmg'] = 0;
        });
    }
    
    if (r === 2)
    {
        
    }

    if (r === 3)
    {
        //+25-31 dmg
        skills.push(() =>
        {
            name = "Brutal Swing";

            fatCost += 30;
            effects['dmg'] += rndInt(25, 31);
        });
    }
}

function loadBlocks(r: number)
{
    //+2-9 block
    skills.push(() =>
    {
        name = "Block";

        const x = rndInt(2, 5);
        fatCost -= 5 - x;
        const blockArr = [0, 1, 2, 4];
        effects['block'] += x + blockArr[r];
    });

    //stance: 3-13 block
    skills.push(() =>
    {
        name = "Barricade";

        const x = rndInt(3, 6);
        fatCost -= 5 - x;
        const stanceArr = [0, 2, 4, 7];
        effects['stance'] = x + stanceArr[r];
    });

    //+1-4 block, retaliate: 2-7 dmg
    skills.push(() =>
    {
        name = "Riposte";

        const x = rndInt(1, 4);
        fatCost -= 4 - x;
        effects['block'] += x;
        const riposteDmgArr = [0, 1, 2, 4];
        effects['retaliate'] = {dmg: (rndInt(2, 3) + riposteDmgArr[r])}; 
    });

    //+0-5 block, steadfast
    skills.push(() =>
    {
        name = "Stand Ready";

        const x = rndInt(0, 1);
        fatCost -= -1 - x;
        effects['steadfast'] = true;
        const blockArr = [0, 1, 2, 4];
        effects['block'] += x + blockArr[r];
    });

    if (r === 1)
    {
        //+1-6 block, if opponent used N fatigue: apply 1 Vulnerable
        skills.push(() =>
        {
            name = "Throw Off Balance";
    
            fatCost += 8;
            const blockArr = [0, 1, 2, 4];
            const x = rndInt(0, 6);
            effects['block'] += rndInt(0, 2) + blockArr[r];
            effects['offBalanceReq'] = 20 + x;
        });
    }

    if (r === 2)
    {
        
    }

    if (r === 3)
    {
        //steadfast, double the base block of previous block
        skills.push(() =>
        {
            name = "Unrelenting Defence";
    
            effects['steadfast'] = true;
        });
    }
}

function loadTricks(r: number)
{
    if (r === 1)
    {
        
    }

    if (r === 2)
    {
        //disarm
        skills.push(() =>
        {
            name = "Disarm";
            description = "Interrupt your opponent's next attack.";
        });
    }

    if (r === 3)
    {
        
    }

}

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}