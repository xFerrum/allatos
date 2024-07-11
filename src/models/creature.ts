import { Activity } from "./activity";
import { Skill } from "./skill";
import { Trait } from "./trait";
import { Status } from "./status";

export class Creature
{
    crID: string;
    name: string;
    type: string;
    str: number;
    agi: number;
    int: number;
    con: number;
    ini: number;
    stamina: number;
    ownedBy: string;
    skills: Array<Skill> = [];
    traits: Array<Trait> = [];
    xp: number;
    level: number;
    born: Date;
    skillPicks: boolean;
    lvlup: number;
    battlesWon: number;
    needsCopy = true;
    baseSelf: Creature | undefined;
    currentAct?: Activity;

    //for battle
    HP?: number;
    block?: number;
    fatigue?: number;
    turnInfo?: any;
    lingering?: any;
    deck?: Array<Skill>;
    grave?: Array<Skill>;
    statuses?: Array<Status>;

    constructor(crID: string, name: string, type: string, str: number, agi: number, int: number, con: number, ini: number,
        ownedBy: string, skills: Array<Skill>, traits: Array<Trait>, stamina: number, xp: number, born: Date, level: number,
        skillPicks: boolean, lvlup: number, battlesWon: number, currentAct?: Activity)
    {
        this.crID = crID;
        this.name = name;
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.int = int;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
        this.skills = skills;
        this.traits = traits;
        this.stamina = stamina;
        this.xp = xp;
        this.born = born;
        this.currentAct = currentAct;
        this.skillPicks = skillPicks;
        this.level = level;
        this.lvlup = lvlup;
        this.battlesWon = battlesWon;

        if (this.needsCopy)
        {
            this.needsCopy = false;
            this.baseSelf = Object.assign({}, this);;
            this.applyTraits();
        }
    }

    traitFuncs = new Map<string, Function>
    ([
        ["Strong", (cr: Creature): Creature =>
            {
                cr.str++;
                return(cr);
            }
        ],
        ["Muscular", (cr: Creature): Creature =>
            {
                cr.str += 2;
                return(cr);
            }
        ],
        ["Absolutely Jacked", (cr: Creature): Creature =>
            {
                cr.str += 4;
                return(cr);
            }
        ],
        ["Cursed", (cr: Creature): Creature =>
            {
                cr.str --;
                cr.agi --;
                cr.int--;
                cr.con -= 5;
                return(cr);
            }
        ],
    ]);

    applyTraits()
    {
        if (this.traits)
        {
            for (let t of this.traits)
            {
                if (!t.isScaling) this.traitFuncs.get(t.name)!(this);
            }
        }
    }
}
