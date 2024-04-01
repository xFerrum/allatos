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

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase)
    gameState = 0; 
    playerOneActs: boolean; //who won ini roll or whose skill is resolving next
    p1pick: Skill;
    p2pick: Skill;
    p1SkillsUsed: Skill[] = [];
    p2SkillsUsed: Skill[] = [];
    p1CanPick: boolean;
    p2CanPick: boolean;

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
    //players can pick 1-1 skill, after both players picked, they can pick 1-1 again
    skillPicked(owneruid: string, skill: Skill): boolean //TODO: if players picked 1-1 send to clients the skills picked
    {
        if (this.gameState === 10)
        {
            if (owneruid === this.uid1)
            {
                this.p1SkillsUsed.push(skill);
                this.p1CanPick = false;
            }
            else
            {
                this.p2SkillsUsed.push(skill);
                this.p2CanPick = false;
            }

            if (!this.p1CanPick && !this.p2CanPick) this.revealPhase();
        }

        if ((this.p1SkillsUsed.length + this.p2SkillsUsed.length) >= 4)
        {
            this.actionPhase();

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

            this.p1CanPick = true;
            this.p2CanPick = true;
            this.sendLog();
            return true;
        }
        else return false;
    }

    startOfTurn()
    {
        this.gameState = 10;

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
            this.combatLog += this.cr1.name + " won the initiative roll. (";
        }
        console.log(this.cr1.name);
        console.log(this.cr1.ini);
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

    revealPhase()
    {
        this.gameState = 20;

        console.log(this.p1SkillsUsed);
        console.log(this.p1SkillsUsed);

        this.combatLog += this.cr1.name + " picked skill: " + this.p1SkillsUsed[0].description;
        this.combatLog += this.cr2.name + " picked skill: " + this.p1SkillsUsed[0].description;
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('reveal-phase');
    }

    actionPhase()
    {
        this.gameState = 30;

        console.log(this.p1SkillsUsed);
        console.log(this.p1SkillsUsed);

        this.combatLog += this.cr1.name + " picked skill: " + this.p1SkillsUsed[0].description;
        this.combatLog += this.cr2.name + " picked skill: " + this.p1SkillsUsed[0].description;
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('reveal-phase');
    }

    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }
}