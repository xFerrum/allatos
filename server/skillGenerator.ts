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
    keywords: shredder: remove X block from opp || heavy: builds more fatigue on opponent (but also more on you?) || combo: extra effect if next skill is attack too
- BLOCK
    base: 4-5-6-8
    keywords: stance: extra block if previous was block too || retaliate: deal damage if all damage blocked (heavier fatigue cost on blocker?) || heal
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

    skills: Function[] = [];

    generateSkill(rarity: number, type: string): Skill
    {
        this.effects = {};
        this.fatCost = 0;

        switch(type)
        {
            case 'attack':
                const dmgarr = [10, 11, 12, 15];
                this.effects.dmg = dmgarr[rarity] 
                this.fatCost = 10;
                this.selfTarget = false;

                this.loadAttacks(rarity);

                break;



            case 'block':
                const blockarr = [7, 7, 8, 10];
                this.effects.block = blockarr[rarity];
                this.fatCost = 3;
                this.selfTarget = true;

                this.loadBlocks(rarity);

                break;
        }

        this.skills[Math.floor(Math.random() * this.skills.length)](); //get random element
        return (new Skill(type, this.selfTarget, this.effects, this.fatCost, rarity, this.name));
    }

    loadAttacks(r: number)
    {
        //+3-12 dmg
        this.skills.push(() =>
        {
            this.name = "Strike";
            this.effects.dmg += this.rndInt(3, 6) + (r * 2);
        });

        //+0-6 dmg, +heavy 4-9 
        this.skills.push(() =>
        {
            this.name = "Heavy attack";
            this.effects.dmg += r * 2;
            this.effects.heavy = this.rndInt(4, 6) + r;
        });

        //+0-6 dmg, +shred 4-9
        this.skills.push(() =>
        {
            this.name = "Shred";
            this.effects.dmg += r * 2;
            this.effects.shred = this.rndInt(4, 6) + r;
        });

        //combo: +7-17 dmg
        this.skills.push(() =>
        {
            this.name = "Twin strike";
            this.effects.combo = {dmg: this.rndInt(7, 11) + (r * 2)};
        });
    }

    loadBlocks(r: number)
    {
        //+2-8 block
        this.skills.push(() =>
        {
            this.name = "Block";
            this.effects.block += this.rndInt(2, 5) + (r);
        });

        //stance: 3-12 block, +1 fatCost
        this.skills.push(() =>
        {
            this.name = "Barricade";
            this.effects.stance = this.rndInt(3, 6) + (r * 2);
            this.fatCost += 1;
        });

        //+1-4 block, retaliate: 2-6 dmg
        this.skills.push(() =>
        {
            this.name = "Riposte";
            this.effects.block += this.rndInt(1, 4);
            this.effects.retaliate = {dmg: (this.rndInt(2, 3) + r)}; 
        });
    }

    rndInt(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}