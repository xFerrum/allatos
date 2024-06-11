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
let rarity: number;

//TODO: separate functions for adding each effect, these could be used for modifying skills too (after theyve already been generated)
export function generateSkill(c: boolean, r: boolean, l: boolean, type = 'random'): Skill
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
            effects['dmg'] = 7; 
            fatCost = 10;
            selfTarget = false;

            loadAttacks(c, r, l);

            break;



        case 'block':
            effects['block'] = 5;
            fatCost = 3;
            selfTarget = true;

            loadBlocks(c, r, l);

            break;



        case 'trick':

            loadTricks(c, r, l);

            break;
    }

    skills[Math.floor(Math.random() * skills.length)](); //get random element
    return (new Skill(type, selfTarget, effects, fatCost, rarity, name));
}

function loadAttacks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        //+8-10 dmg
        skills.push(() =>
        {
            name = "Strike";
    
            const x = rndInt(4, 6);
            fatCost -= 6 - x;
            effects['dmg'] += x + 4;
        });
    
        //+4 dmg, +9-11 heavy
        skills.push(() =>
        {
            name = "Heavy Attack";
    
            const x = rndInt(4, 6);
            fatCost -= 6 - x;
            effects['dmg'] += 4;
            effects['heavy'] = x + 5;
        });
    
        //+4 dmg, +6-9 shred
        skills.push(() =>
        {
            name = "Shred";
    
            const x = rndInt(4, 7);
            fatCost -= 6 - x;
            effects['dmg'] += 4;
            effects['shred'] = x + 2;
        });
    
        //combo: +9-12 dmg
        skills.push(() =>
        {
            name = "Twin Strike";
    
            fatCost += 2;
            const x = rndInt(6, 9);
            fatCost -= 9 - x;
            effects['combo'] = {dmg: x + 3};
        });
    
        //combo: +15-18 heavy
        skills.push(() =>
        {
            name = "Overwhelm";
    
            const x = rndInt(11, 14);
            fatCost -= 12 - x;
            effects['combo'] = {heavy: x + 4};
        });
    }

    if (r)
    {
        skills.push(() =>
        {
            //deal damage equal to block
            name = "Body Slam";
    
            fatCost += 2;
            effects['dmg'] = 0;
        });
    }

    if (l)
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

function loadBlocks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        //+5-7 block
        skills.push(() =>
        {
            name = "Block";
    
            const x = rndInt(3, 5);
            fatCost -= 5 - x;
            effects['block'] += x + 2;
        });
    
        //stance: 7-9 block
        skills.push(() =>
        {
            name = "Barricade";
    
            const x = rndInt(4, 6);
            fatCost -= 5 - x;
            effects['stance'] = x + 3;
        });
    
        //+2-4 block, retaliate: 6-8 dmg
        skills.push(() =>
        {
            name = "Riposte";
    
            const x = rndInt(2, 4);
            fatCost -= 4 - x;
            effects['block'] += x;
            effects['retaliate'] = {dmg: (rndInt(4, 6) + 2)}; 
        });
    
        //+3-4 block, steadfast
        skills.push(() =>
        {
            name = "Stand Ready";
    
            const x = rndInt(1, 2);
            fatCost += x;
            effects['steadfast'] = true;
            effects['block'] += x + 2;
        });
    }

    if (r)
    {
        //+2-4 block, if opponent used N fatigue: apply 1 Vulnerable
        skills.push(() =>
        {
            name = "Throw Off Balance";
    
            fatCost += 3;
            const x = rndInt(0, 6);
            effects['block'] += rndInt(0, 2) + 2;
            effects['offBalanceReq'] = 18 + x;
        });
    }

    if (l)
    {
        //steadfast, double the base block of previous block
        skills.push(() =>
        {
            name = "Unrelenting Defence";
    
            effects['steadfast'] = true;
        });
    }
}

function loadTricks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        
    }

    if (r)
    {
        //disarm
        skills.push(() =>
        {
            name = "Disarm";
            description = "Interrupt your opponent's next attack.";
        });
    }

    if (l)
    {
        
    }

}

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}