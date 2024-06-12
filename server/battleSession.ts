import { ServerCreature } from "./models/serverCreature";
import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { Status } from "./models/status";
import { Trait } from "./models/trait";

export class BattleSession
{
    roomID!: string;
    crs: Array<ServerCreature> = [];
    uids: Array<String> = [];
    io: any;
    sockets: Array<any> = [];
    gameOverCb: Function;

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase) || 40: turn ending
    gameState = 0; 
    playerOneFirst: boolean; //who won ini roll, player one = players[0], player two = players[1]
    skillsUsed: Array<Array<Skill>> = [[], []];
    canPicks: Array<boolean> = [];

    combatLog = "";
    skillsOrdered: Array<Skill> = [];

    constructor(roomID: string, cr: ServerCreature, io: any, gameOverCb: Function)
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
        this.crs[0].statuses = [];

        this.roomID = roomID;
        this.io = io;
    }

    addSecondPlayer(cr: ServerCreature)
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
        this.crs[1].statuses = [];

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

        let pickedBy: ServerCreature;
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
            this.crs[1].addStatus("First", 1);
            this.playerOneFirst = false;
            this.combatLog += this.crs[1].name + " won the initiative roll. (";
        }
        else
        {
            this.crs[0].addStatus("First", 1);
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
        if (!(this.crs[0].hasStatus("Fatigued"))) this.canPicks[0] = true;
        if (!(this.crs[1].hasStatus("Fatigued"))) this.canPicks[1] = true;

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

        //activate blocks
        for (let i = 0; i < this.skillsUsed[0].length; i++)
        {
            if (this.skillsUsed[0][i].type === 'block')
            {
                this.useSkill(0, 1, this.skillsUsed[0][i]);

                this.skillsUsed[0].splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this.skillsUsed[1].length; i++)
        {
            if (this.skillsUsed[1][i].type === 'block')
            {
                this.useSkill(1, 0, this.skillsUsed[1][i]);
                this.skillsUsed[1].splice(i, 1);
                i--;
            }
        }
        this.combatLog += "Total blocks:\n" + this.crs[0].name + " - " + this.crs[0].block + "\n" + this.crs[1].name + " - " + this.crs[1].block + "\n";
        this.sendLog();

        this.gameState = 35;
        //construct attack skill order and activate them
        let p1turn = this.playerOneFirst;
        while (0 < this.skillsUsed[0].length + this.skillsUsed[1].length)
        {
            if (p1turn)
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
            p1turn = !p1turn;
        }

        for (let i = 0; i < this.skillsOrdered.length; i++)
        {
            let currentSkill = this.skillsOrdered[i];
            let actor: number;
            let opponent: number;

            if (this.skillsOrdered[i].usedByID === this.crs[0].crID)
            {
                actor = 0;
                opponent = 1;
            }
            else
            {
                actor = 1;
                opponent = 0;
            }

            this.useSkill(actor, opponent, currentSkill);

            this.checkIfGameEnd();
        }

        this.endOfTurn();
        this.startOfTurn();
        this.sendLog();
    }

    endOfTurn()
    {
        this.gameState = 40;

        this.turnEndEffects();

        this.checkIfGameEnd();

        this.io.to(this.roomID).emit('turn-ended');
    }

    turnEndEffects()
    {
        let actor = this.playerOneFirst ? 0 : 1;
        let opp = this.playerOneFirst ? 1 : 0;

        for (let i = 0; i < 2; i++)
        {
            if (this.crs[actor].turnInfo.retaliate && !(this.crs[actor].turnInfo.gotHit) && this.crs[opp].turnInfo.attacked)
            {
                if ('dmg' in this.crs[actor].turnInfo.retaliate)
                {
                    this.hit(this.crs[actor], this.crs[opp], this.crs[actor].turnInfo.retaliate.dmg);
                }
            }

            //count down statuses
            this.crs[actor].statuses.map((s) => {s.duration--});
            console.log(this.crs[actor].statuses);
            this.crs[actor].statuses = this.crs[actor].statuses.filter((s) => s.duration > 0);

            //apply end of turn status gains
            if (this.crs[i].fatigue >= this.crs[i].stamina)
            {
                this.crs[i].addStatus("Fatigued", 1);
                this.crs[i].addStatus("Vulnerable", 1);
                this.crs[i].fatigue -= this.crs[i].stamina;
            }

            if (this.crs[actor].turnInfo.offBalance)
            {
                let fatSum = 0;
                this.skillsUsed[actor].forEach((s: Skill) =>
                {
                    fatSum += s.fatCost;
                });
                if (this.crs[actor].turnInfo.offBalance >= fatSum) this.crs[actor].addStatus("Vulnerable", 1);
            }

            if (!this.crs[actor].turnInfo.steadfast) this.removeBlock(this.crs[actor], this.crs[actor].block);
        }

        this.resetTurnInfo();
    }

    addBlock(cr: ServerCreature, amount: number)
    {
        cr.block += amount;
        this.combatLog += cr.name + " is blocking " + amount + ".\n"

        this.io.to(this.roomID).emit('action-happened', {type: 'gain-block', block: amount, actorID: cr.crID});
        this.sendSnapshot();
    }

    removeBlock(cr: ServerCreature, amount: number)
    {
        if (amount > cr.block) amount = cr.block;
        cr.block -= amount;

        this.io.to(this.roomID).emit('action-happened', {type: 'remove-block', block: -1 * amount, actorID: cr.crID});
        this.sendSnapshot();
    }

    hit(actor: ServerCreature, target: ServerCreature, dmg: number, skill?: Skill)
    {
        if (skill) dmg = skill.effects.dmg;

        if (actor.hasStatus("Weakened")) dmg *= 0.75;
        if (target.hasStatus("Vulnerable")) dmg *= 1.25;

        dmg = Math.floor(dmg);
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

        //apply statuses from skill
        if (skill)
        {
            if ("Weakened" in skill.effects)
            {
                target.addStatus("Weakened", skill.effects["Weakened"]);
            }
            if ("Vulnerable" in skill.effects)
            {
                target.addStatus("Vulnerable", skill.effects["Vulnerable"]);
            }
        }

        this.combatLog += target.name + " got hit for " + dmg + " damage.\n"
        this.io.to(this.roomID).emit('action-happened', {type: 'hit', dmg: dmg, targetID: target.crID});
        this.sendSnapshot();
    }

    //discard hand, draw X skills from deck
    drawHand(cr: ServerCreature)
    {
        //put leftover skills from last turn into deck
        cr.deck.push(...cr.skills);
        cr.skills.splice(0, cr.skills.length);
        this.drawCards(cr, 5);
    }

    drawCards(cr: ServerCreature, n: number)
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

    playerWon(cr: ServerCreature)
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

    //send 1 for every action-happened
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

    useSkill(actor: number, opponent: number, skill: Skill)
    {
        this.io.to(this.roomID).emit('action-happened', skill);
        this.sendSnapshot();

        //for cards with unique effects
        switch(skill.name)
        {
            case "Body Slam":
                skill.effects.dmg = this.crs[actor].block;
                break;

            case "Throw Off Balance":
                this.crs[opponent].turnInfo.offBalance = skill.effects.offBalanceReq;
                break;

            case "Unrelenting Defence":
                if (this.crs[actor].turnInfo?.lastSkill && 'block' === this.crs[actor].turnInfo.lastSkill.type)
                {
                    this.addBlock(this.crs[actor], this.crs[actor].turnInfo.lastSkill.effects.block)
                }
                break;

            case "Take The High Ground":
                this.crs[opponent].turnInfo.highGroundDebuff = true;
                break;

            case "Punishing Blow":
                if (this.crs[opponent].fatigue >= this.crs[opponent].stamina) skill.effects.dmg *= 1.5;
                break;

            default:
                break;
        }

        switch(skill.type)
        {
            case 'attack':
                this.crs[actor].turnInfo.attacked = true;

                if (this.crs[actor].turnInfo.highGroundDebuff)
                {
                    skill.fatCost *= 2;
                    this.crs[actor].turnInfo.highGroundDebuff = false;
                }
                if (this.crs[actor].turnInfo?.lastSkill && 'combo' in this.crs[actor].turnInfo.lastSkill.effects)
                {
                    for (let eff in this.crs[actor].turnInfo.lastSkill.effects.combo)
                    {
                        if (eff in skill.effects)
                        {
                            skill.effects[eff] += this.crs[actor].turnInfo.lastSkill.effects.combo[eff];
                        }
                        else
                        {
                            skill.effects[eff] = this.crs[actor].turnInfo.lastSkill.effects.combo[eff];
                        }
                    }
                }
                if ('shred' in skill.effects)
                {
                    this.removeBlock(this.crs[opponent], skill.effects.shred);
                }
                if ('heavy' in skill.effects)
                {
                    this.crs[opponent].fatigue += skill.effects.heavy;
                }

                this.hit(this.crs[actor], this.crs[opponent], skill.effects.dmg,skill);
                break;
            
                
            case 'block':
                if ('stance' in skill.effects)
                {
                    if (this.crs[actor].turnInfo.lastSkill?.type === 'block')
                    {
                        this.addBlock(this.crs[actor], skill.effects.stance);
                    }
                }
                if ('retaliate' in skill.effects)
                {
                    for (let eff in skill.effects.retaliate)
                    {
                        if (eff in this.crs[actor].turnInfo.retaliate)
                        {
                            this.crs[actor].turnInfo.retaliate[eff] += skill.effects.retaliate[eff];    
                        }
                        else
                        {
                            this.crs[actor].turnInfo.retaliate[eff] = skill.effects.retaliate[eff];
                        }
                    }
                }
                if ('steadfast' in skill.effects)
                {
                    this.crs[actor].turnInfo.steadfast = true;
                }

                this.addBlock(this.crs[actor], skill.effects.block);
                break;
        }

        this.crs[actor].fatigue += skill.fatCost;
        this.crs[actor].turnInfo.lastSkill = skill;
        this.crs[actor].grave.push(skill);

        this.io.to(this.roomID).emit('action-happened', {type: ''});
        this.sendSnapshot();
        this.sendLog();
    }
}