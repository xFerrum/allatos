import { Skill } from "../../src/models/skill";
/*
NOTES/IDEAS:
- rarity: 0-3 minor, major, pro, mythical or smth idk WIP
- attacks stronger than blocks, but fatigue significantly sooner, comboable
- blocks: less comboable, but can counter opponent's attacks, takes priority to attacks in combat
- fatigue: skills build up fatigue, have to rest after a certain amount
- diminishing returns on creature attributes (ie: 10 str -> 100% dmg , 15 str -> 120% dmg , 20 str -> 130% dmg)

- craft multiple cards of same rarity -> upgrade another card or smth
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
            fatCost = 10;
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

        const dmgArr = [1, 2, 4, 7];
        effects['dmg'] += rndInt(3, 6) + dmgArr[r];
    });

    //+0-7 dmg, +4-10 heavy
    skills.push(() =>
    {
        name = "Heavy Attack";

        const dmgArr = [0, 2, 4, 7];
        effects['dmg'] += dmgArr[r];
        const heavyArr = [0, 1, 2, 4];
        effects['heavy'] = rndInt(4, 6) + heavyArr[r];
    });

    //+0-6 dmg, +4-10 shred
    skills.push(() =>
    {
        name = "Shred";

        const dmgArr = [0, 2, 4, 6];
        effects['dmg'] += dmgArr[r];
        const shredArr = [1, 2, 3, 5];
        effects['shred'] = rndInt(3, 6) + shredArr[r];
    });

    //combo: +7-18 dmg
    skills.push(() =>
    {
        name = "Twin Strike";

        const comboDmgArr = [0, 2, 4, 7];
        effects['combo'] = {dmg: rndInt(7, 11) + comboDmgArr[r]};
    });

    //comb: +7-17 heavy
    skills.push(() =>
    {
        name = "Overwhelm";

        const comboFatArr = [0, 2, 4, 7];
        effects['combo'] = {heavy: rndInt(7, 10) + comboFatArr[r]};
    });

    if (r === 3)
    {
        //+25-31 dmg +30 fatcost
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

        const blockArr = [0, 1, 2, 4];
        effects['block'] += rndInt(2, 5) + blockArr[r];
    });

    //stance: 3-13 block, +1 fatCost
    skills.push(() =>
    {
        name = "Barricade";

        const stanceArr = [0, 2, 4, 7];
        effects['stance'] = rndInt(3, 6) + stanceArr[r];
        fatCost += 1;
    });

    //+1-4 block, retaliate: 2-7 dmg
    skills.push(() =>
    {
        name = "Riposte";

        effects['block'] += rndInt(1, 4);
        const riposteDmgArr = [0, 1, 2, 4];
        effects['retaliate'] = {dmg: (rndInt(2, 3) + riposteDmgArr[r])}; 
    });

    //+0-5 block, steadfast
    skills.push(() =>
    {
        name = "Stand Ready";

        effects['steadfast'] = true;
        const blockArr = [0, 1, 2, 4];
        effects['block'] += rndInt(0, 1) + blockArr[r];
    });

    if (r === 3)
    {
        
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