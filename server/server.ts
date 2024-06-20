import { BattleSession } from "./battleSession";
import { Creature } from "./models/creature";
import { ServerCreature } from "./models/serverCreature";
import { CrService } from "./db_services/crService";

const crService = new CrService;
const battlesInProgress = new Map<string, BattleSession>;
const waiting: Array<any> = [];
let pairingPeople = false;
let roomCounter = 0;

const io = require('socket.io')(3000,
{
  cors:
  {
    origin: ['http://localhost:8100'],
  }
});

io.on('connection', (socket: any) =>
{
  socket.on('queue-up', (uid: string, crID: string) =>
  {
    socket.data.uid = uid;
    socket.data.crID = crID;
    waiting.push(socket);
  });

  socket.on('disconnect', () =>
  {
    console.log('Socket disconnected: '+ socket.id);
  });

  socket.on('game-state-requested', () =>
  {
    battlesInProgress.get(socket.data.roomID)?.sendGameState();
  });

  socket.on('play-skill', (owneruid: string, index: number) =>
  {
    let battle = battlesInProgress.get(socket.data.roomID);
    battle.skillPicked(owneruid, index, socket);
  });
});

//start matching people every 5 seconds
setInterval(async () =>
{
  console.log("interval");
  if (!pairingPeople)
  {
    console.log("try to match")
    pairingPeople = true;

    while (waiting.length >= 2)
    { 
      console.log("can match");
      let socket1 = waiting.shift();
      let socket2 = waiting.shift();
      roomCounter++;
      await joinRoom(socket1, socket1.data.crID, roomCounter.toString());
      await joinRoom(socket2, socket2.data.crID, roomCounter.toString());
    }

    pairingPeople = false;
  }
}, 5000);

async function joinRoom(socket: any, crID: string, roomID: string)
{
  await socket.join(roomID);
  socket.data.roomID = roomID;

  if (!battlesInProgress.has(roomID)) //if it's the first user joining the room (for the first time)
  {
    let newBattle = new BattleSession(roomID, await crService.getCreatureById(crID), io, async (winner: ServerCreature) =>
    {
      await crService.addWin(winner);
      battlesInProgress.delete(roomID);
    });
    newBattle.sockets[0] = socket;

    battlesInProgress.set(roomID, newBattle);
  }
  else if (battlesInProgress.get(roomID)!.uids[1] === undefined) //if joining user is the second one to connect (to new match)
  {
    let battle = battlesInProgress.get(roomID);
    battle.sockets[1] = socket;

    battle.addSecondPlayer(await crService.getCreatureById(crID));
    io.to(roomID).emit('players-ready');
  }
  else //user is rejoining, check if its p1 or p2
  {
    let battle = battlesInProgress.get(roomID);
    battle.playerRejoin(socket);
  }
};

function convertClientCreature(cr: Creature): ServerCreature
{
  return new ServerCreature(cr.crID, cr.name, cr.type, cr.str, cr.agi, cr.int, cr.con, cr.ini, cr.ownedBy, cr.skills, cr.traits, cr.stamina, cr.xp, cr.born, cr.level, [], cr.lvlup, cr.battlesWon, cr?.currentAct);
}