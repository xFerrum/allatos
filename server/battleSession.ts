import { Creature } from "../src/classes/creature";
import { Skill } from "../src/classes/skill";

export class BattleSession
{
    roomID!: string;
    cr1!: Creature;
    cr2!: Creature;
    uid1!: string;
    uid2!: string;
    maxHP1!: number;
    maxHP2!: number;
    io: any;

    //gameState: number; IDEA: replace conditions with gameState checks (numbered starting from 1, each number means a different state like pick phase, reveal phase, action phase etc)
    playerOneActs: boolean; //who won ini roll or whose skill is resolving next
    p1pick: Skill;
    p2pick: Skill;
    p1SkillsUsed: Skill[] = [];
    p2SkillsUsed: Skill[] = [];
    combatLog = "";

    constructor(roomID: string, cr: Creature, io: any)
    {
        this.roomID = roomID;
        this.cr1 = cr;
        this.uid1 = cr.ownedBy;
        this.maxHP1 = cr.con;
        this.io = io;
    }

    addSecondPlayer(cr: Creature)
    {
        this.cr2 = cr;
        this.uid2 = cr.ownedBy;
        this.maxHP2 = cr.con;
        this.startOfTurn();
    }

    //picked skills are stored until both players have chosen, if chosen 2-2 -> execute skills
    //return true if action phase happened
    skillPicked(owneruid: string, skill: Skill): boolean
    {
        if (owneruid === this.uid1) 
        {
            this.p1SkillsUsed.push(skill);
        }
        else
        {
            this.p2SkillsUsed.push(skill);
        }

        if ((this.p1SkillsUsed.length + this.p2SkillsUsed.length) >= 4)
        {
            for (let i = 0; i < 4; i++)
            {
                let currentSkill: Skill;
                let actor: Creature;
                let opponent: Creature;
                if (this.playerOneActs)
                {
                    currentSkill = this.p1SkillsUsed.shift();
                    actor = this.cr1;
                    opponent = this.cr2;
                }
                else
                {
                    currentSkill = this.p2SkillsUsed.shift();
                    actor = this.cr2;
                    opponent = this.cr1;
                }

                if (currentSkill.selfTarget)
                    this.useSkillOn(actor, currentSkill);
                else
                    this.useSkillOn(opponent, currentSkill);

                this.playerOneActs = !this.playerOneActs;
            }

            this.sendLog();
            return true;
        }
        else return false;
    }

    startOfTurn()
    {
        //chance of who goes first is relative to each other's ini -> if 30v20 then 30 ini has 60% chance of going first
        const iniTotal = this.cr1.ini + this.cr2.ini;
        const randomNumber = iniTotal * Math.random();
        if (randomNumber > this.cr1.ini)
        {
            this.playerOneActs = false;
            this.combatLog += this.cr2.name + " won the initiative roll. (";
        }
        else
        {
            this.playerOneActs = true;
            this.combatLog += this.cr2.name + " won the initiative roll. (";
        }
        this.combatLog += "rolled " + randomNumber + "/" + iniTotal + ")\n";
        this.sendLog();
    }

    endOfTurn()
    {

    }

    startAction()
    {

    }

    useSkillOn(creature: Creature, skill: Skill)
    {
        switch(skill.type)
        {
            case 'attack':
                creature.con -= skill.effects.dmg;
                this.combatLog += creature.name + " got hit for " + skill.effects.dmg + " damage.\n"
                break;
        }
        
        console.log(creature.name);
    }

    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }
}