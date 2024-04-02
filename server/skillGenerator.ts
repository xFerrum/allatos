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

/* TEMPLATE for randomly picking skill effects

const rollArr = Array.from(Array(100).keys());
while (points >= 3)
    {
        let roll = this.roll(rollArr);
        {
            switch (roll) {
                case value:
                    break;
                        
                default:
                    rollArr.splice(rollArr.indexOf(roll), 1);
                    this.roll(rollArr)
                    break;
            }
        }
    }
*/

export class SkillGenerator
{
    //steps: determine type, get points to spend based on rarity -> calculate sum of effect chances for given type -> roll randomly (between 0 and sum)
    //      -> iterate through effects in EC object (and subtract the effect chance each time) until roll is "<= 0" -> add that effect
    generateSkill(rarity: number, type: string): Skill
    {
        let s: Skill;
        s.type = type;
        
        let points = 10 + rarity*4;

        switch(type)
        {
            case 'attack':
                const dmgarr = [5.5, 6.5, 8, 10];
                s.effects.dmg = dmgarr[rarity] 
                s.fatCost = 10;

                while (points >= 3)
                {
                    let roll = Math.random() * this.sumOfWeights(this.AEC);
                    {
                        for (var effect in this.AEC)
                        {
                            if (Object.hasOwnProperty(effect))
                            {
                                roll -= this.AEC[effect];
                            }
                            if (roll <= 0)
                            {
                                s.effects[effect] = this.AECFuncs[effect];
                            }
                        }
                    }
                }
                break;



            case 'block':
                const blockarr = [4, 4.5, 5.5, 7];
                s.effects.block = blockarr[rarity];
                s.fatCost = 5;

                break;
        }

    }

    //attack effect chances (weights)
    AEC = 
    {
        'shredder': 10,
        'heavy': 10,
    };

    AECFuncs =
    {
        'shredder': () =>
        {
            return 1;
        },
        'heavy': () =>
        {
            return(Math.round(Math.random() * 4 + 4));
        },
    };

    //block effect chances (weights)
    BEC = 
    {
        'stance': 10,
        'retaliate': 10,
        'heal': 10,
    };

    sumOfWeights(EC: Object)
    {
        let sum = 0;

        for (var effect in EC)
        {
            if (Object.hasOwnProperty(effect))
            {
                sum += EC[effect];
            }
        }

        return sum;
    }
}