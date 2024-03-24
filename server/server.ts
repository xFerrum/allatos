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
  
  socket.on('join-room', async (roomID: string, joinSuccessful: Function) => 
  {
    await socket.join(roomID);
    joinSuccessful(true);
  })
})