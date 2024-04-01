import { BattleSession } from "./battleSession";
import { Creature } from "../src/classes/creature";
import { Skill } from "../src/classes/skill";

const battlesInProgress = new Map<string, BattleSession>;

const io = require('socket.io')(3000,
  {
    cors:
    {
      origin: ['http://localhost:8100'],
    }
  });

io.on('connection', (socket: any) =>
{
  console.log(socket.id);
  
  socket.on('join-room', async (cr: Creature, roomID: string, joinSuccessful: Function) =>
  {
    await socket.join(roomID);
    joinSuccessful(true);
    socket.data.roomID = roomID;
    socket.data.uid = cr.ownedBy;

    if (!battlesInProgress.has(roomID)) //if it's the first user joining the room (for the first time)
    {
      let newBattle = new BattleSession(roomID, cr, io);

      battlesInProgress.set(roomID, newBattle);
    }
    else if (battlesInProgress.get(roomID)!.uid2 === undefined) //if joining user is the second one to connect (to new match)
    {
      let battle = battlesInProgress.get(roomID);

      battle.addSecondPlayer(cr);
      const cr1 = battle.cr1;
      const cr2 = battle.cr2;
      io.to(roomID).emit('players-ready', cr1, cr2, battle.maxHP1, battle.maxHP2); //cr1 = player1's (joined 1st), cr = player2's (joined 2nd)
    }
    else //user is rejoining, check if its p1 or p2
    {
      let battle = battlesInProgress.get(roomID);

      let canPick = false;
      if (battle.uid1 === socket.data.uid) canPick = true;
      if (battle.uid2 === socket.data.uid) canPick = true;

      io.to(roomID).emit('player-rejoin', battle.cr1, battle.cr2, battle.maxHP1, battle.maxHP2, canPick);
    }
  });

  socket.on('disconnect', () =>
  {
    console.log('Socket disconnected: '+ socket.id);
  });

  //get cr1 and cr2, apply effects on target, and emit updates
  //creatureOne: is creature 1 the actor?
  socket.on('play-skill', (owneruid: string, skill: Skill) =>
  {
    let battle = battlesInProgress.get(socket.data.roomID);
    if(battle.skillPicked(owneruid, skill))
    {
      io.to(battle.roomID).emit('skill-used', battle.cr1, battle.cr2);
    }
  });
});

function startOfAction()
{

}
