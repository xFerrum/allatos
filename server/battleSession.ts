import { Creature } from "./models/creature";
import { Skill } from "./models/skill";

export class BattleSession
{
    roomID!: string;
    crs: Array<Creature> = [];
    uids: Array<String> = [];
    io: any;
    sockets: Array<any> = [];
    gameOverCb: Function;

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase) || 40: turn ending
    gameState = 0; 
    playerOneFirst: boolean; //who won ini roll, player one = players[0], player two = players[1]
    skillsUsed: Array<Array<Skill>> = [[], []];
    skillLogs: Array<Array<Skill>> = [[], []];
    canPicks: Array<boolean> = [];

    combatLog = "";
    skillsOrdered: Array<Skill> = [];

    constructor(roomID: string, cr: Creature, io: any, gameOverCb: Function)
    {
        this.gameOverCb = gameOverCb;

        this.crs[0] = cr;
        this.uids[0] = cr.ownedBy;
        this.crs[0].HP = cr.con;
        this.crs[0].fatigue = 0;
        this.crs[0].deck = [];
        this.crs[0].deck.push(...this.crs[0].skills);
        this.crs[0].skills.splice(0, this.crs[0].skills.length);
        this.crs[0].grave = [];
        this.crs[0].lingering = {};

        this.roomID = roomID;
        this.io = io;
    }

    addSecondPlayer(cr: Creature)
    {
        this.crs[1] = cr;
        this.uids[1] = cr.ownedBy;
        this.crs[1].HP = cr.con;
        this.crs[1].fatigue = 0;
        this.crs[1].deck = [];
        this.crs[1].deck.push(...this.crs[1].skills);
        this.crs[1].skills.splice(0, this.crs[1].skills.length);
        this.crs[1].grave = [];
        this.crs[1].lingering = {};

        this.crs[0].block = 0;
        this.crs[1].block = 0;
        this.resetTurnInfo();
        this.startOfTurn();
    }

    playerRejoin(socket: any)
    {
        if (socket.data.uid === this.uids[0])
        {
            this.sockets[0] = socket;
        }
        else
        {
            this.sockets[1] = socket;
        }

        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];

        this.sockets[0].emit('player-rejoin');
        this.sockets[1].emit('player-rejoin');
    }

    //this is the main function driving the gameplay
    //players can pick 1-1 skill, after both players picked, they can pick 1-1 again (reveal phase), then action phase
    skillPicked(owneruid: string, index: number, socket: any)
    {
        //block foul play from a client
        if (owneruid === this.uids[0] && !this.canPicks[0]) return;
        if (owneruid === this.uids[1] && !this.canPicks[1]) return;

        let pickedBy: Creature;
        let skill: Skill;

        if (this.gameState === 10 || this.gameState === 20)
        {
            if (owneruid === this.uids[0])
            {
                pickedBy = this.crs[0];
                skill = pickedBy.skills[index];
                this.skillsUsed[0].push(skill);
                this.canPicks[0] = false;
            }
            else
            {
                pickedBy = this.crs[1];
                skill = pickedBy.skills[index];
                this.skillsUsed[1].push(skill);
                this.canPicks[1] = false;
            }
            skill.usedByID = pickedBy.crID;


        pickedBy.skills.splice(pickedBy.skills.indexOf(skill), 1);

            if (!this.canPicks[0] && !this.canPicks[1])
            {
                if (this.gameState === 10)
                    this.revealPhase();
                else if (this.gameState === 20)
                    this.actionPhase();
                
            }
            else this.sendGameState();
        }

    }

    //roll ini, set blocks to 0, start of turn triggers
    startOfTurn()
    {
        this.gameState = 10;

        //chance of who goes first is relative to each other's ini -> if 30v20 then 30 ini has 60% chance of going first
        const iniTotal = this.crs[0].ini + this.crs[1].ini;
        const randomNumber = iniTotal * Math.random();
        if (randomNumber > this.crs[0].ini)
        {
            this.playerOneFirst = false;
            this.combatLog += this.crs[1].name + " won the initiative roll. (";
        }
        else
        {
            this.playerOneFirst = true;
            this.combatLog += this.crs[0].name + " won the initiative roll. (";
        }
        this.combatLog += "rolled " + randomNumber + "/" + iniTotal + ")\n";
        this.drawHand(this.crs[0]);
        this.drawHand(this.crs[1]);
        this.canPicks[0] = true;
        this.canPicks[1] = true;
        this.sendLog();
        this.sendGameState();
    }

    revealPhase()
    {
        this.gameState = 20;

        this.combatLog += this.crs[0].name + " picked skill:\n" + this.skillsUsed[0][0].description + "\n";
        this.combatLog += this.crs[1].name + " picked skill:\n" + this.skillsUsed[1][0].description + "\n";
        if (!(this.crs[0].turnInfo.fatigued)) this.canPicks[0] = true;
        if (!(this.crs[1].turnInfo.fatigued)) this.canPicks[1] = true;

        this.sendLog();
        if(!this.canPicks[0] && !this.canPicks[1])
        {
            this.actionPhase();
        }
        else
        {
            this.sockets[0].emit('skill-revealed', this.skillsUsed[1][0]);
            this.sockets[1].emit('skill-revealed', this.skillsUsed[0][0]);
            this.sendGameState();
        }
    }

    actionPhase()
    {
        this.sendGameState();

        this.gameState = 30;
        this.skillsOrdered = [];
        this.skillLogs[0] = this.skillsUsed[0].slice();
        this.skillLogs[1] = this.skillsUsed[1].slice();

        //activate blocks, player order doesnt matter
        for (let i = 0; i < this.skillsUsed[0].length; i++)
        {
            if (this.skillsUsed[0][i].type === 'block')
            {
                this.useSkill(this.crs[0], this.crs[1], this.skillsUsed[0][i]);

                this.skillsUsed[0].splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this.skillsUsed[1].length; i++)
        {
            if (this.skillsUsed[1][i].type === 'block')
            {
                this.useSkill(this.crs[1], this.crs[0], this.skillsUsed[1][i]);
                this.skillsUsed[1].splice(i, 1);
                i--;
            }
        }
        this.combatLog += "Total blocks:\n" + this.crs[0].name + " - " + this.crs[0].block + "\n" + this.crs[1].name + " - " + this.crs[1].block + "\n";
        this.sendLog();

        this.gameState = 35;
        //construct attack skill order and activate them
        let P1turn = this.playerOneFirst;
        while (0 < this.skillsUsed[0].length + this.skillsUsed[1].length)
        {
            if (P1turn)
            {
                if (this.skillsUsed[0].length > 0)
                {
                    this.skillsOrdered.push(this.skillsUsed[0].shift());
                }
                else this.skillsOrdered.push(this.skillsUsed[1].shift());
            }
            else
            {
                if (this.skillsUsed[1].length > 0)
                {
                    this.skillsOrdered.push(this.skillsUsed[1].shift());
                }
                else this.skillsOrdered.push(this.skillsUsed[0].shift());

            }
            P1turn = !P1turn;
        }

        for (let i = 0; i < this.skillsOrdered.length; i++)
        {
            let currentSkill = this.skillsOrdered[i];
            let actor: Creature;
            let opponent: Creature;

            if (this.skillsOrdered[i].usedByID === this.crs[0].crID)
            {
                actor = this.crs[0];
                opponent = this.crs[1];
            }
            else
            {
                actor = this.crs[1];
                opponent = this.crs[0];
            }

            this.useSkill(actor, opponent, currentSkill);

            this.checkIfGameEnd();
        }

        if (this.playerOneFirst)
        {
            this.afterActionPhase(this.crs[0], this.crs[1]);
            this.afterActionPhase(this.crs[1], this.crs[0]);
        }
        else
        {
            this.afterActionPhase(this.crs[1], this.crs[0]);
            this.afterActionPhase(this.crs[0], this.crs[1]);
        }

        this.endOfTurn();
        this.startOfTurn();
        this.sendLog();
    }

    afterActionPhase(actor: Creature, opponent: Creature)
    {

        if (actor.turnInfo.retaliate && !(actor.turnInfo.gotHit) && opponent.turnInfo.attacked)
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

        this.procTurnInfo();

        this.resetTurnInfo();

        if (this.crs[0].fatigue >= this.crs[0].stamina)
        {
            this.crs[0].turnInfo.fatigued = true;

            this.crs[0].fatigue -= this.crs[0].stamina;
        }
        if (this.crs[1].fatigue >= this.crs[1].stamina)
        {
            this.crs[1].turnInfo.fatigued = true;

            this.crs[1].fatigue -= this.crs[1].stamina;
        }

        this.io.to(this.roomID).emit('turn-ended');
    }

    procTurnInfo()
    {
        if (!this.crs[0].turnInfo.steadfast) this.removeBlock(this.crs[0], this.crs[0].block);
        if (!this.crs[1].turnInfo.steadfast) this.removeBlock(this.crs[1], this.crs[1].block);

        if (this.crs[0].turnInfo.offBalance)
        {
            let fatSum = 0;
            this.skillsUsed[0].forEach((s: Skill) =>
                {
                    fatSum += s.fatCost;
                }
            );
            if (this.crs[0].turnInfo.offBalance >= fatSum) {}//TODO: apply vulnerable
        }
    }

    addBlock(cr: Creature, amount: number)
    {
        cr.block += amount;
        this.combatLog += cr.name + " is blocking " + amount + ".\n"

        this.io.to(this.roomID).emit('action-happened', {type: 'gain-block', block: amount, actorID: cr.crID});
        this.sendSnapshot();
    }

    removeBlock(cr: Creature, amount: number)
    {
        if (amount > cr.block) amount = cr.block;
        cr.block -= amount;

        this.io.to(this.roomID).emit('action-happened', {type: 'remove-block', block: -1 * amount, actorID: cr.crID});
        this.sendSnapshot();
    }

    hit(actor: Creature, target: Creature, dmg: number)
    {
        if (dmg > target.block)
        {
            //hit
            target.turnInfo.gotHit = true;
            dmg -= target.block;
            this.removeBlock(target, target.block);
        }
        else
        {
            //miss
            this.removeBlock(target, dmg);
            dmg = 0;
        }
        target.HP -= dmg;

        this.combatLog += target.name + " got hit for " + dmg + " damage.\n"
        this.io.to(this.roomID).emit('action-happened', {type: 'hit', dmg: dmg, targetID: target.crID});
        this.sendSnapshot();
    }

    //discard hand, draw X skills from deck
    drawHand(cr: Creature)
    {
        //put leftover skills from last turn into deck
        cr.deck.push(...cr.skills);
        cr.skills.splice(0, cr.skills.length);
        this.drawCards(cr, 5);
    }

    drawCards(cr: Creature, n: number)
    {
        for (let i = 0; i < n; i++)
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
    }

    //check if cr1 or cr2 hp is below 0 (tie if both below 0)
    checkIfGameEnd()
    {
        if (this.crs[0].HP <= 0)
        {
/*             if (this.crs[1].HP <= 0)
            {
                //tie
            }
            else */
            {
                //p2 won
                this.gameState = 666;
                this.playerWon(this.crs[1]);
            }
        }
        else if (this.crs[1].HP <= 0)
        {
            //p1 won
            this.gameState = 666;
            this.playerWon(this.crs[0]);
        }
    }

    resetTurnInfo()
    {
        this.crs[0].turnInfo = {retaliate: {}};
        this.crs[1].turnInfo = {retaliate: {}};
    }

    playerWon(cr: Creature)
    {
        this.io.to(this.roomID).emit('turn-ended');
        this.sendGameState();
        this.io.to(this.roomID).emit('player-won', cr.ownedBy);
        this.sockets[0].disconnect();
        this.sockets[1].disconnect();
        this.gameOverCb(cr);
    }

    sendGameState()
    {
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];
        decoy1.ownedBy = null;
        decoy2.ownedBy = null;

        this.sockets[0].emit('game-state-sent', this.crs[0], this.canPicks[0], decoy2, cr2SkillsLength, this.gameState);
        this.sockets[1].emit('game-state-sent', this.crs[1], this.canPicks[1], decoy1, cr1SkillsLength, this.gameState);
    }

    sendSnapshot()
    {
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];
        decoy1.ownedBy = null;
        decoy2.ownedBy = null;

        this.sockets[0].emit('snapshot-sent', this.crs[0], decoy2, cr2SkillsLength);
        this.sockets[1].emit('snapshot-sent', this.crs[1], decoy1, cr1SkillsLength);
    }

    gameStateRequested(socket: any)
    {
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];

        if (socket === this.sockets[0])
        {
            this.sockets[0].emit('game-state-sent', this.crs[0], this.canPicks[0], decoy2, cr2SkillsLength, this.gameState);
        }
        if (socket === this.sockets[1])
        {
        this.sockets[1].emit('game-state-sent', this.crs[1], this.canPicks[1], decoy1, cr1SkillsLength, this.gameState);
        }
    }

    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }

    useSkill(actor: Creature, opponent: Creature, skill: Skill)
    {
        this.io.to(this.roomID).emit('action-happened', skill);
        this.sendSnapshot();

        actor.fatigue += skill.fatCost;

        //for cards with unique effects
        switch(skill.name)
        {
            case 'Throw Off Balance':
                opponent.turnInfo.offBalance = skill.effects.offBalanceReq;
            
            default:
                break;
        }

        switch(skill.type)
        {
            case 'attack':
                actor.turnInfo.attacked = true;

                //combo check
                if (actor.turnInfo?.lastSkill && 'combo' in actor.turnInfo.lastSkill.effects)
                {
                    for (let eff in actor.turnInfo.lastSkill.effects.combo)
                    {
                        if (eff in skill.effects)
                        {
                            skill.effects[eff] += actor.turnInfo.lastSkill.effects.combo[eff];
                        }
                        else
                        {
                            skill.effects[eff] = actor.turnInfo.lastSkill.effects.combo[eff];
                        }
                    }
                }

                if ('shred' in skill.effects)
                {
                    this.removeBlock(opponent, skill.effects.shred);

                }
                if ('heavy' in skill.effects)
                {
                    opponent.fatigue += skill.effects.heavy;
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
                if ('steadfast' in skill.effects)
                {
                    actor.turnInfo.steadfast = true;
                }

                this.addBlock(actor, skill.effects.block);
                break;
        }

        actor.turnInfo.lastSkill = skill;
        actor.grave.push(skill);

        this.sendLog();
    }
}