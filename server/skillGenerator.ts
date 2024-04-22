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
    keywords:
        shredder: remove X block from opp
        heavy: builds more fatigue on opponent (but also more on you?)
        combo: extra effect if next skill is attack too

- BLOCK
    base: 4-5-6-8
    keywords:
        stance: extra block if previous was block too
        retaliate: deal damage if opponent attacked and all damage blocked (heavier fatigue cost on blocker?)
        heal

- DEBUFF
    keywords: stun || poison ? || 
- BUFF
    keywords: heal
*/

/*
Method of generation:
    - get the rarity and type of skill to be generated
    - add baseline skill properties
    - load skill (functions) of that type into "skills" array
    - choose a skill function randomly (and input rarity, so effects can be scaled accordingly), it adds/modifies the property variables
    - construct and return skill at end of generateSkill
*/

//TODO: put variables inside generateSkill, load attack/block skills into different array and call those
export class SkillGenerator
{
    selfTarget!: boolean;
    effects: any = {};
    fatCost!: number;
    name!: string;;
    description = "";

    skills!: Function[];

    generateSkill(rarity: number, type: string): Skill
    {
        this.effects = {};
        this.fatCost = 0;
        this.skills = [];
        
        switch(type)
        {
            case 'attack':
                const dmgArr = [10, 11, 12, 15];
                this.effects.dmg = dmgArr[rarity] 
                this.fatCost = 10;
                this.selfTarget = false;

                this.loadAttacks(rarity);

                break;



            case 'block':
                const blockArr = [7, 7, 8, 10];
                this.effects.block = blockArr[rarity];
                this.fatCost = 3;
                this.selfTarget = true;

                this.loadBlocks(rarity);

                break;

            case 'trick':

                this.loadTricks(rarity);

                break;
        }

        this.skills[Math.floor(Math.random() * this.skills.length)](); //get random element
        return (new Skill(type, this.selfTarget, this.effects, this.fatCost, rarity, this.name));
    }

    loadAttacks(r: number)
    {
        //+3-13 dmg
        this.skills.push(() =>
        {
            this.name = "Strike";

            const dmgArr = [0, 2, 4, 7];
            this.effects.dmg += this.rndInt(3, 6) + dmgArr[r];
        });

        //+0-7 dmg, +heavy 4-10 
        this.skills.push(() =>
        {
            this.name = "Heavy Attack";

            const dmgArr = [0, 2, 4, 7];
            this.effects.dmg += dmgArr[r];
            const heavyArr = [0, 1, 2, 4];
            this.effects.heavy = this.rndInt(4, 6) + heavyArr[r];
        });

        //+0-6 dmg, +shred 4-10
        this.skills.push(() =>
        {
            this.name = "Shred";

            const dmgArr = [0, 2, 4, 6];
            this.effects.dmg += dmgArr[r];
            const shredArr = [1, 2, 3, 5];
            this.effects.shred = this.rndInt(3, 6) + shredArr[r];
        });

        //combo: +7-18 dmg
        this.skills.push(() =>
        {
            this.name = "Twin Strike";

            const comboDmgArr = [0, 2, 4, 7];
            this.effects.combo = {dmg: this.rndInt(7, 11) + comboDmgArr[r]};
        });
    }

    loadBlocks(r: number)
    {
        //+2-9 block
        this.skills.push(() =>
        {
            this.name = "Block";

            const blockArr = [0, 1, 2, 4];
            this.effects.block += this.rndInt(2, 5) + blockArr[r];
        });

        //stance: 3-13 block, +1 fatCost
        this.skills.push(() =>
        {
            this.name = "Barricade";

            const stanceArr = [0, 2, 4, 7];
            this.effects.stance = this.rndInt(3, 6) + stanceArr[r];
            this.fatCost += 1;
        });

        //+1-4 block, retaliate: 2-7 dmg
        this.skills.push(() =>
        {
            this.name = "Riposte";

            this.effects.block += this.rndInt(1, 4);
            const riposteDmgArr = [0, 1, 2, 4];
            this.effects.retaliate = {dmg: (this.rndInt(2, 3) + riposteDmgArr[r])}; 
        });

        //+0-5 block, steadfast
        this.skills.push(() =>
        {
            this.name = "Stand Ready";

            this.effects.steadfast = true;
            const blockArr = [0, 1, 2, 4];
            this.effects.block += this.rndInt(0, 1) + blockArr[r];
        });
    }

    loadTricks(r: number)
    {
        if (r = 1)
        {
            
        }

        if (r = 2)
        {
            //disarm
            this.skills.push(() =>
            {
                this.name = "Disarm";
                this.description = "Interrupt your opponent's next attack.";
            });
        }

        if (r = 3)
        {
            
        }

    }

    rndInt(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}