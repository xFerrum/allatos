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

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase) || 40: turn ending
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
        this.cr1 = cr;
        this.uid1 = cr.ownedBy;
        this.cr1.HP = cr.con;
        this.cr1.fatigue = 0;
        this.cr1.deck = [];
        this.cr1.deck.push(...this.cr1.skills);
        this.cr1.skills.splice(0, this.cr1.skills.length);
        this.cr1.grave = [];
        this.cr1.turnInfo = {};
        this.cr1.lingering = {};

        this.roomID = roomID;
        this.io = io;
    }

    addSecondPlayer(cr: Creature)
    {
        this.cr2 = cr;
        this.uid2 = cr.ownedBy;
        this.cr2.HP = cr.con;
        this.cr2.fatigue = 0;
        this.cr2.deck = [];
        this.cr2.deck.push(...this.cr2.skills);
        this.cr2.skills.splice(0, this.cr2.skills.length);
        this.cr2.grave = [];
        this.cr2.turnInfo = {};
        this.cr2.lingering = {};

        console.log(this.cr1.deck, this.cr2.deck)
        this.startOfTurn();
    }

    //this is the main function driving the gameplay
    //players can pick 1-1 skill, after both players picked, they can pick 1-1 again (reveal phase), then action phase
    skillPicked(owneruid: string, index: number)
    {
        //block foul play from a client
        if (owneruid === this.uid1 && !this.p1CanPick) return;
        if (owneruid === this.uid2 && !this.p2CanPick) return;

        let pickedBy: Creature;
        let skill: Skill;

        if (this.gameState === 10 || this.gameState === 20)
        {
            if (owneruid === this.uid1)
            {
                pickedBy = this.cr1;
                skill = pickedBy.skills[index];
                skill.usedByP1 = true;
                this.p1SkillsUsed.push(skill);
                this.p1CanPick = false;
            }
            else
            {
                pickedBy = this.cr2;
                skill = pickedBy.skills[index];
                skill.usedByP1 = false;
                this.p2SkillsUsed.push(skill);
                this.p2CanPick = false;
            }

        console.log(pickedBy.skills.indexOf(skill));
        pickedBy.skills.splice(pickedBy.skills.indexOf(skill), 1);


            if (!this.p1CanPick && !this.p2CanPick)
            {
                if (this.gameState === 10)
                    this.revealPhase();
                else if (this.gameState === 20)
                    this.actionPhase();
                
            }
        }

        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.p1CanPick, this.p2CanPick);
    }

    //roll ini, set blocks to 0, start of turn triggers
    startOfTurn()
    {
        this.gameState = 10;
        this.cr1.block = 0;
        this.cr2.block = 0;
        this.cr1.turnInfo = {retaliate: {}, combo: {}};
        this.cr2.turnInfo = {retaliate: {}, combo: {}};
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
        this.drawHand(this.cr1);
        this.drawHand(this.cr2);
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.p1CanPick, this.p2CanPick);
    }

    revealPhase()
    {
        this.gameState = 20;

        this.combatLog += this.cr1.name + " picked skill:\n" + this.p1SkillsUsed[0].description + "\n";
        this.combatLog += this.cr2.name + " picked skill:\n" + this.p2SkillsUsed[0].description + "\n";
        this.p1CanPick = true;
        this.p2CanPick = true;

        this.sendLog();
        this.io.to(this.roomID).emit('game-state-sent', this.cr1, this.cr2, this.p1CanPick, this.p2CanPick);
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

        if (this.playerOneFirst)
        {
            this.afterActionPhase(this.cr1, this.cr2);
            this.afterActionPhase(this.cr2, this.cr1);
        }
        else
        {
            this.afterActionPhase(this.cr2, this.cr1);
            this.afterActionPhase(this.cr1, this.cr2);
        }

        this.endOfTurn();
        this.startOfTurn();
        this.sendLog();
    }

    afterActionPhase(actor: Creature, opponent: Creature)
    {
        if (actor.turnInfo.retaliate && !(actor.turnInfo.gotHit))
        {
            if ('dmg' in actor.turnInfo.retaliate)
            {
                this.hit(actor, opponent, actor.turnInfo.retaliate.dmg);
            }
        }
    }

    endOfTurn()
    {
        this.gameState = 40;
    }

    useSkill(actor: Creature, opponent: Creature, skill: Skill)
    {
        actor.fatigue += skill.fatCost;
        //TODO: if fatigue higher than stamina ->trigger fatigued effect (maybe check at end of turn?)
        switch(skill.type)
        {
            case 'attack':

                if ('shred' in skill.effects)
                {
                    opponent.block -= skill.effects.shred;
                    if (opponent.block < 0) opponent.block = 0;
                }
                if ('heavy' in skill.effects)
                {
                    opponent.fatigue += skill.effects.heavy;
                }
                if ('combo' in skill.effects)
                {
                    for (let eff in skill.effects.combo)
                    {
                        if (eff in actor.turnInfo.combo)
                        {
                            actor.turnInfo.combo[eff] += skill.effects.combo[eff];
                        }
                        else
                        {
                            actor.turnInfo.combo[eff] = skill.effects.combo[eff];
                        }
                    }
                }

                this.hit(actor, opponent, skill.effects.dmg);
                break;
            
            case 'block':

                if ('stance' in skill.effects)
                {
                    if (actor.turnInfo.lastSkill?.type === 'block')
                    {
                        this.addBlock(actor, skill.effects.stance);
                    }
                }
                if ('retaliate' in skill.effects)
                {
                    for (let eff in skill.effects.retaliate)
                    {
                        if (eff in actor.turnInfo.retaliate)
                        {
                            actor.turnInfo.retaliate[eff] += skill.effects.retaliate[eff];    
                        }
                        else
                        {
                            actor.turnInfo.retaliate[eff] = skill.effects.retaliate[eff];
                        }
                    }
                }
                    
                this.addBlock(actor, skill.effects.block);
                break;
        }

        actor.turnInfo.lastSkill = skill;
        actor.grave.push(skill);

        this.sendLog();
    }

    addBlock(cr: Creature, amount: number)
    {
        cr.block += amount;
        this.combatLog += cr.name + " is blocking " + amount + ".\n"
    }

    hit(actor: Creature, target: Creature, dmg: number)
    {
        if (actor.turnInfo.combo)
        {
            if ('dmg' in actor.turnInfo.combo)
            {
                dmg += actor.turnInfo.combo.dmg;
            }

            actor.turnInfo.combo = {};
        }

        if (dmg > target.block)
        {
            //hit
            target.turnInfo.gotHit = true;
            dmg -= target.block;
            target.block = 0;
        }
        else
        {
            //miss
            target.block -= dmg;
            dmg = 0;
        }
        target.HP -= dmg;

        this.combatLog += target.name + " got hit for " + dmg + " damage.\n"

    }

    //discard hand, draw X skills from deck
    drawHand(cr: Creature)
    {


        //discard leftover skills from last turn
        cr.grave.push(...cr.skills);
        cr.skills.splice(0, cr.skills.length);
        for (let i = 0; i < 5; i++)
        {
            //if deck is empty, shuffle grave back to deck
            if (cr.deck.length === 0)
            {
                cr.deck.push(...cr.grave);
                cr.grave.splice(0, cr.grave.length);
            }

            const drawIndex = Math.floor(Math.random() * cr.deck.length);
            cr.skills.push(cr.deck.splice(drawIndex, 1)[0]);
        }

        console.log(cr.grave.length + cr.deck.length + cr.skills.length);

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
    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }
}