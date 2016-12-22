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
  clients.push(socket);
  updateUserlist();
  console.log("socket connection");

  socket.on("disconnect", function(socket)
  {
    clients.splice(clients.indexOf(socket), 1);
    updateUserlist();
    console.log("socket disconnect");
  });

  socket.on("send-message", function(message)
  {
    io.sockets.emit("send-message", message);
    console.log("send-message: " + message.text);
  });

  socket.on("change-name", function(name)
  {
    socket.name = name;
    updateUserlist();
  });
});

function updateUserlist()
{
  io.sockets.emit("userlist-update", clients.map((client) =>
  {
    return client.name;
  }));
}
