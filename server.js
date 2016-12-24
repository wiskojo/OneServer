var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);

var port = process.env.PORT || 3001;

http.listen(port, function()
{
  console.log('Listening on: ' + port);
});

io.on("connection", function(socket)
{

  // Initialize socket fields
  socket.name = socket.handshake.query["user"];
  socket.room = socket.handshake.query["room"];
  // Pushes socket into appropriate room
  socket.join(socket.room);

  // Update userlist to every client in the socket's room
  updateUserlist(socket.room);
  console.log("socket-connection: " + socket.name + " in room " + socket.room);

  socket.on("disconnect", function()
  {
    // Update the userlist of every client in the socket's room pre-disconnect
    updateUserlist(socket.room);
    console.log("socket-disconnect: " + socket.name + " from room " + socket.room);
  });

  socket.on("send-message", function(message)
  {
    // Emit message from socket to every client in the socket's
    // room(including the socket itself)
    io.to(socket.room).emit("send-message", message);
    console.log("send-message: " + message.text);
  });

  socket.on("tab-change", function(tab)
  {
    var prevRoom = socket.room;

    // Socket popped from current room and pushed into new room
    socket.leave(socket.room);
    socket.room = tab !== undefined ? tab.url : "/";
    socket.join(socket.room);

    // Room update event emitted to socket to update its state.room
    socket.emit("room-update", socket.room);
    console.log("Room update of socket " + socket.name + " to " + socket.room);
    // Update userlist event fired to clients in the socket's
    // previous and current room
    updateUserlist(prevRoom);
    updateUserlist(socket.room);
  });

});

function updateUserlist(room)
{
  if(!(room == null || io.sockets.adapter.rooms[room] == null))
  {
    // Create an array of all socket IDs in room
    var socketIds = Object.keys(io.sockets.adapter.rooms[room].sockets);
    // Emit userlist-update to room with names of all clients in room
    io.to(room).emit("userlist-update",
      socketIds.map((socketId) =>
    {
      return io.sockets.connected[socketId].name;
    }));
  }
}
