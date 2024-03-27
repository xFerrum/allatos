import { BattleSession } from "./battleSession";
import { Creature } from "../src/classes/creature";

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
    console.log(await io.in(roomID).fetchSockets());
    joinSuccessful(true);

    //if it's the first user joining the room (for the first time)
    if (!battlesInProgress.has(roomID))
    {
      let newBattle = new BattleSession(roomID, cr);

      battlesInProgress.set(roomID, newBattle);
    }
    else if (battlesInProgress.get(roomID)!.uid2 === undefined) //if joining user is the second one to connect (to new match)
    {
      battlesInProgress.get(roomID)!.addSecondPlayer(cr);
      const cr1 = battlesInProgress.get(roomID)!.cr1;
      io.to(roomID).emit('players-ready', cr1, cr); //cr = player2's (joined 2nd), cr1 = player1's (joined 1st)
    }
    else
    {
      //TODO: rejoin match
    }
  });

  socket.on('disconnect', () =>
  {
    console.log('Socket disconnected: '+ socket.id);
  })
})