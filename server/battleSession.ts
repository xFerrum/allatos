import { Creature } from "../src/classes/creature";
import { Skill } from "../src/classes/skill";

export class BattleSession
{
    roomID!: string;
    cr1!: Creature;
    cr2!: Creature;
    uid1!: string;
    uid2!: string;
    io: any;

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase)
    gameState = 0; 
    playerOneFirst: boolean; //who won ini roll
    p1pick: Skill;
    p2pick: Skill;
    p1SkillsUsed: Skill[] = [];
    p2SkillsUsed: Skill[] = [];
    p1CanPick: boolean;
    p2CanPick: boolean;
    combatLog = "";
    skillsOrdered: Skill[] = [];

    constructor(roomID: string, cr: Creature, io: any)
    {
        this.roomID = roomID;
        this.cr1 = cr;
        this.uid1 = cr.ownedBy;
        this.cr1.HP = cr.con;
        this.io = io;
        
    }

    addSecondPlayer(cr: Creature)
    {
        this.cr2 = cr;
        this.uid2 = cr.ownedBy;
        this.cr2.HP = cr.con;
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
                skill.usedByP1 = true;
                this.p1SkillsUsed.push(skill);
                this.p1CanPick = false;
            }
            else
            {
                skill.usedByP1 = false;
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
    }

    //roll ini, set blocks to 0, start of turn triggers
    startOfTurn()
    {
        this.gameState = 10;
        this.cr1.block = 0;
        this.cr2.block = 0;
        //chance of who goes first is relative to each other's ini -> if 30v20 then 30 ini has 60% chance of going first
        const iniTotal = this.cr1.ini + this.cr2.ini;
        const randomNumber = iniTotal * Math.random();
        if (randomNumber > this.cr1.ini)
        {
            this.playerOneFirst = false;
            this.combatLog += this.cr2.name + " won the initiative roll. (";
        }
        else
        {
            this.playerOneFirst = true;
            this.combatLog += this.cr1.name + " won the initiative roll. (";
        }
        this.combatLog += "rolled " + randomNumber + "/" + iniTotal + ")\n";
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.cr1.HP, this.cr2.HP, this.p1CanPick, this.p2CanPick);
    }

    revealPhase()
    {
        this.gameState = 20;

        this.combatLog += this.cr1.name + " picked skill:\n" + this.p1SkillsUsed[0].description + "\n";
        this.combatLog += this.cr2.name + " picked skill:\n" + this.p2SkillsUsed[0].description + "\n";
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.cr1.HP, this.cr2.HP, this.p1CanPick, this.p2CanPick);
    }

    actionPhase()
    {
        this.gameState = 30;
        this.skillsOrdered = [];

        //activate blocks, player order doesnt matter
        for (let i = 0; i < this.p1SkillsUsed.length; i++)
        {
            if (this.p1SkillsUsed[i].type === 'block')
            {
                this.useSkill(this.cr1, this.cr2, this.p1SkillsUsed[i]);
                this.p1SkillsUsed.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this.p2SkillsUsed.length; i++)
        {
            if (this.p2SkillsUsed[i].type === 'block')
            {
                this.useSkill(this.cr2, this.cr1, this.p2SkillsUsed[i]);
                this.p2SkillsUsed.splice(i, 1);
                i--;
            }
        }
        this.combatLog += "Total blocks:\n" + this.cr1.name + " - " + this.cr1.block + "\n" + this.cr2.name + " - " + this.cr2.block + "\n";
        this.sendLog();

        this.gameState = 35;
        //construct attack skill order and activate them
        while (0 < this.p1SkillsUsed.length + this.p2SkillsUsed.length)
        {
            let P1turn = this.playerOneFirst;

            if (P1turn)
            {
                if (this.p1SkillsUsed.length > 0)
                {
                    this.skillsOrdered.push(this.p1SkillsUsed.shift());
                }
                else this.skillsOrdered.push(this.p2SkillsUsed.shift());
                P1turn = !P1turn;
            }
            else
            {
                if (this.p2SkillsUsed.length > 0)
                {
                    this.skillsOrdered.push(this.p2SkillsUsed.shift());
                }
                else this.skillsOrdered.push(this.p1SkillsUsed.shift());

                P1turn = !P1turn;
            }
        }

        for (let i = 0; i < this.skillsOrdered.length; i++)
        {
            let currentSkill = this.skillsOrdered[i];
            let actor: Creature;
            let opponent: Creature;

            if (this.skillsOrdered[i].usedByP1)
            {
                actor = this.cr1;
                opponent = this.cr2;
            }
            else
            {
                actor = this.cr2;
                opponent = this.cr1;
            }

            this.useSkill(actor, opponent, currentSkill);

            this.checkIfGameEnd();
        }

        this.sendLog();
        this.startOfTurn();
    }

    useSkill(actor: Creature, opponent: Creature, skill: Skill)
    {
        switch(skill.type)
        {
            case 'attack':
                let incomingDmg = skill.effects.dmg;
                if (incomingDmg > opponent.block)
                {
                    //hit
                    incomingDmg -= opponent.block;
                    opponent.block = 0;
                }
                else
                {
                    //miss
                    opponent.block -= incomingDmg;
                    incomingDmg = 0;
                }
                opponent.HP -= incomingDmg;
                this.combatLog += opponent.name + " got hit for " + incomingDmg + " damage.\n"
                break;
            
            case 'block':
                actor.block += skill.effects.block;
                this.combatLog += actor.name + " is blocking " + skill.effects.block + ".\n"
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
        if (this.cr1.HP <= 0)
        {
            if (this.cr2.HP <= 0)
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
        else if (this.cr2.HP <= 0)
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