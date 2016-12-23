var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);

var clients = [];
var port = process.env.PORT || 3001;

http.listen(port, function()
{
  console.log('listening on: ' + port);
});

io.on("connection", function(socket)
{

  socket.on("initialize-connection", function(data)
  {
    socket.name = data.name;
    socket.room = data.tab !== undefined ? data.tab.url : "/";
    socket.join(socket.room);

    clients.push(socket);

    updateUserlist(socket);
    console.log("socket-connection: " + socket.name + " in room " + socket.room);
  });

  socket.on("disconnect", function()
  {
    clients.splice(clients.indexOf(socket), 1);
    updateUserlist(socket);
    console.log("socket-disconnect: " + socket.name + " from room " + socket.room);
  });

  socket.on("send-message", function(message)
  {
    io.to(socket.room).emit("send-message", message);
    console.log("send-message: " + message.text);
  });

  socket.on("tab-change", function(tab)
  {
    console.log("Server handles tab-change event");
    var prevRoom = socket.room;

    socket.leave(socket.room);
    socket.room = tab !== undefined ? tab.url : "/";
    socket.join(socket.room);

    socket.emit("room-update", socket.room);
    console.log("Room update of socket " + socket.name + " to " + socket.room);
    updateUserlist(socket, prevRoom);
  });

});

function updateUserlist(socket, prevRoom)
{
  if(prevRoom !== undefined)
  {
    io.to(prevRoom).emit("userlist-update", clients.map((client) =>
    {
      if(client.room == prevRoom)
      {
        return client.name;
      }
    }));
  }
  io.to(socket.room).emit("userlist-update", clients.map((client) =>
  {
    if(client.room == socket.room)
    {
      return client.name;
    }
  }));
}
