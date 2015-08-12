// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT|| 3000;


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// users trying to play
var quickPlayUsers = new Array();

io.sockets.on('connection', function(socket) {
  var addedUser = false;

  //=== Create and Join sockets ===
  socket.on('join', function(data) {
    socket.join(data.email); // We are using room of socket io
  });

  socket.on('joinGame', function(data){

    //TODO change game room to variable 
    io.to('jsmith@gmail.com').emit('userJoined', {msg: 'User Joined Game', game:data.game, user:data.user});
  })


  //=== Quick play sockets ===
  socket.on('findOpponent', function(data){
    socket.join(data.email);
    quickPlayUsers.push(data);

    if(quickPlayUsers.length >1){
      var index = quickPlayUsers.length -1;
      while(index >= 0){
         var opponentData = quickPlayUsers[index];
         if(opponentData != data && opponentData.subject == data.subject){
            io.to(data.email).emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:opponentData.email, subject:data.subject});
            io.to(opponentData.email).emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:data.email, subject:data.subject});
            var userIndex = quickPlayUsers.indexOf(data);
            socket.leave(data.email);
            quickPlayUsers.splice(userIndex,1);
            quickPlayUsers.splice(index,1);
            break;
         }else{
          index--;
         }
      }
    }
  });

  socket.on('quitMatch', function(data){
   io.to(data.opponentEmail).emit('opponentQuit', {msg:'Your Opponent Forfeited the Match'});
  })


});
