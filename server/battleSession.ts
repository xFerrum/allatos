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
            if (this.crs[actor].turnInfo.has('retaliate') && !(this.crs[actor].turnInfo.get('gotHit')) && this.crs[opp].turnInfo.get('attacked'))
            {
                if (this.crs[actor].turnInfo.get('retaliate').has('dmg'))
                {
                    this.hit(this.crs[actor], this.crs[opp], this.crs[actor].turnInfo.get('retaliate').get('dmg'));
                }
            }

            //count down statuses
            this.crs[actor].statuses.map((s) => {if (s.countsDown) s.counter--});
            this.crs[actor].statuses = this.crs[actor].statuses.filter((s) => s.counter > 0);

            //apply end of turn status gains
            if (this.crs[i].fatigue >= this.crs[i].stamina)
            {
                this.crs[i].addStatus("Fatigued", 1);
                this.crs[i].addStatus("Vulnerable", 1);
                this.crs[i].fatigue -= this.crs[i].stamina;
            }

            if (this.crs[actor].turnInfo.has('offBalance'))
            {
                let fatSum = 0;
                this.skillsUsed[actor].forEach((s: Skill) =>
                {
                    fatSum += s.fatCost;
                });
                if (this.crs[actor].turnInfo.get('offBalance') >= fatSum) this.crs[actor].addStatus("Vulnerable", 1);
            }

            if (!this.crs[actor].turnInfo.has('steadfast')) this.removeBlock(this.crs[actor], this.crs[actor].block);

            actor = this.playerOneFirst ? 1 : 0;
            opp = this.playerOneFirst ? 0 : 1;
        }

        this.resetTurnInfo();
    }

    addBlock(actor: ServerCreature, amount: number, skill?: Skill)
    {
        if (actor.hasStatus("Bolstered")) amount += actor.getStatus("Bolstered").counter;

        let opp = actor === this.crs[0] ? this.crs[1] : this.crs[0];
        actor.block += amount;
        this.combatLog += actor.name + " is blocking " + amount + ".\n"

        //apply statuses from skill
        if (skill) this.applyStatuses(skill, actor, opp);

        this.io.to(this.roomID).emit('action-happened', {type: 'gain-block', block: amount, actorID: actor.crID});
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
        if (actor.hasStatus("Weakened")) dmg *= 0.75;
        if (actor.hasStatus("Pumped")) dmg *= 1.25;
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
        if (skill) this.applyStatuses(skill, actor, target);

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
        this.crs[0].turnInfo = new Map<string, any>([]);
        this.crs[1].turnInfo = new Map<string, any>([]);
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

        //for cards with unique effects (before everything else)
        switch(skill.name)
        {
            case "Body Slam":
                skill.effects.set('dmg', this.crs[actor].block);
                break;

            case "Throw Off Balance":
                this.crs[opponent].turnInfo.set('offBalance', skill.effects.get('offBalanceReq'));
                break;

            case "Unrelenting Defence":
                if (this.crs[actor].turnInfo.has('lastSkill') && 'block' === this.crs[actor].turnInfo.get('lastSkill').type && this.crs[actor].turnInfo.get('lastSkill').effects.has('block'))
                {
                    skill.effects.set('block', this.crs[actor].turnInfo.get('lastSkill').effects.get('block'));
                }
                break;

            case "Take The High Ground":
                this.crs[opponent].turnInfo.set('highGroundDebuff', true);
                break;

            case "Punishing Blow":
                if (this.crs[opponent].fatigue >= this.crs[opponent].stamina) skill.effects.set('dmg', skill.effects.get('dmg') * 1.5);
                break;

            default:
                break;
        }

        switch(skill.type)
        {
            case 'attack':
                this.crs[actor].turnInfo.set('attacked', true);

                if (this.crs[actor].turnInfo.get('highGroundDebuff'))
                {
                    skill.fatCost *= 2;
                    this.crs[actor].turnInfo.set('highGroundDebuff', false);
                }
                if (this.crs[actor].turnInfo.has('lastSkill') && 'combo' in this.crs[actor].turnInfo.get('lastSkill').effects)
                {
                    for (let [effect, value] of this.crs[actor].turnInfo.lastSkill.effects.get('combo'))
                    {
                        if (skill.effects.has(effect))
                        {
                            skill.effects.set(effect, skill.effects.get(effect) + value);
                        }
                        else
                        {
                            skill.effects.set(effect, value);
                        }
                    }
                }
                if ('shred' in skill.effects)
                {
                    this.removeBlock(this.crs[opponent], skill.effects.get('shred'));
                }
                if ('heavy' in skill.effects)
                {
                    this.crs[opponent].fatigue += skill.effects.get('heavy');
                }

                this.hit(this.crs[actor], this.crs[opponent], skill.effects.get('dmg'), skill);
                break;
            
                
            case 'block':
                if (skill.effects.has('stance') && this.crs[actor].turnInfo.has('lastSkill'))
                {
                    for (let [effect, value] of this.crs[actor].turnInfo.get('lastSkill').effects.get('stance'))
                    {
                        if (skill.effects.has(effect))
                        {
                            skill.effects.set(effect, skill.effects.get(effect) + value);
                        }
                        else
                        {
                            skill.effects.set(effect, value);
                        }
                    }
                }
                if (skill.effects.has('retaliate'))
                {
                    for (let [effect, value] of skill.effects.get('retaliate'))
                    {
                        if (this.crs[actor].turnInfo.get('retaliate').has(effect))
                        {
                            this.crs[actor].turnInfo.get('retaliate').set(effect, this.crs[actor].turnInfo.get('retaliate').get(effect) + value);
                        }
                        else
                        {
                            this.crs[actor].turnInfo.get('retaliate').set(effect, value);
                        }
                    }
                }
                if (skill.effects.has('steadfast'))
                {
                    this.crs[actor].turnInfo.set('steadfast', true);
                }

                this.addBlock(this.crs[actor], skill.effects.get('block'), skill);
                break;
        }

        //for cards with unique effects (after everything else)
        switch(skill.name)
        {
            case "Shake It Off":
                this.crs[actor].statuses.map((s) => {if (s.countsDown) s.counter--});
                this.crs[actor].statuses = this.crs[actor].statuses.filter((s) => s.counter > 0);
                break;

            default:
                break;
        }

        this.crs[actor].fatigue += skill.fatCost;
        this.crs[actor].turnInfo.set('lastSkill', skill);
        this.crs[actor].grave.push(skill);

        this.io.to(this.roomID).emit('action-happened', {type: ''});
        this.sendSnapshot();
        this.sendLog();
    }

    //apply statuses from skill
    applyStatuses(skill: Skill, actor: ServerCreature, opp: ServerCreature)
    {
        if (skill.effects.has("Weakened"))
        {
            skill.effects.get("Weakened")[1] ? actor.addStatus("Weakened", skill.effects.get("Weakened")[0]) : opp.addStatus("Weakened", skill.effects.get("Weakened")[0]);
        }
        if (skill.effects.has("Vulnerable"))
        {
            skill.effects.get("Vulnerable")[1] ? actor.addStatus("Vulnerable", skill.effects.get("Vulnerable")[0]) : opp.addStatus("Vulnerable", skill.effects.get("Vulnerable")[0]);
        }
        if (skill.effects.has("Pumped"))
        {
            skill.effects.get("Pumped")[1] ? actor.addStatus("Pumped", skill.effects.get("Pumped")[0]) : opp.addStatus("Pumped", skill.effects.get("Pumped")[0]);
        }
        if (skill.effects.has("Bolstered"))
        {
            skill.effects.get("Bolstered")[1] ? actor.addStatus("Bolstered", skill.effects.get("Bolstered")[0]) : opp.addStatus("Bolstered", skill.effects.get("Bolstered")[0]);
        }
    }
}