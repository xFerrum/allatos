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
    playerOneActs: boolean; //whose skill is resolving next
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

    //this is the main function driving the gameplay
    //players can pick 1-1 skill, after both players picked, they can pick 1-1 again (reveal phase), then action phase
    skillPicked(owneruid: string, skill: Skill)
    {
        //block foul play from a client
        if (owneruid === this.uid1 && !this.p1CanPick) return;
        if (owneruid === this.uid2 && !this.p2CanPick) return;

        if (this.gameState === 10 || this.gameState === 20)
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

            if (!this.p1CanPick && !this.p2CanPick)
            {
                if (this.gameState === 10)
                    this.revealPhase();
                else if (this.gameState === 20)
                    this.actionPhase();
            }
        }

        if (this.gameState === 30)
        {
            this.actionPhase();
        }
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
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.maxHP1, this.maxHP2, this.p1CanPick, this.p2CanPick);
    }

    revealPhase()
    {
        this.gameState = 20;

        this.combatLog += this.cr1.name + " picked skill: " + this.p1SkillsUsed[0].description + "\n";
        this.combatLog += this.cr2.name + " picked skill: " + this.p2SkillsUsed[0].description + "\n";
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.maxHP1, this.maxHP2, this.p1CanPick, this.p2CanPick);
    }

    actionPhase()
    {
        this.gameState = 30;

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

            this.checkIfGameEnd();

            this.playerOneActs = !this.playerOneActs;
        }

        this.sendLog();
        this.startOfTurn();
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

        this.sendLog();
    }

    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }

    //check if cr1 or cr2 hp is below 0 (tie if both below 0)
    checkIfGameEnd()
    {
        if (this.cr1.con <= 0)
        {
            if (this.cr2.con <= 0)
            {
                //tie
            }
            else
            {
                //p2 won
                this.gameState = 666;
                this.playerWon(this.uid2);
            }
        }
        else if (this.cr2.con <= 0)
        {
            //p1 won
            this.gameState = 666;
            this.playerWon(this.uid1);
        }
    }

    playerWon(uid: string)
    {
        this.io.to(this.roomID).emit('player-won', uid);
    }
}