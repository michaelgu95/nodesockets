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

// users trying to play
var quickPlayUsers = new Array();
var finishedUsers = new Array();
var roomClients = {};


io.sockets.on('connection', function(socket) {
  var joinedRoom = false;


  //=== Quick play sockets ===
  if(!joinedRoom){
  joinedRoom = true;
  socket.on('findOpponent', function(data){
    var clients = io.sockets.adapter.rooms[data.email];
    console.log(clients);
   if(roomClients[data.email] == true && clients !== undefined){
     
   }else{
    socket.join(data.email);
    quickPlayUsers.push(data);
    roomClients[data.email] = true;
    console.log(roomClients);
   }
      
    
    if(quickPlayUsers.length > 0){
      var index = quickPlayUsers.length -1;
      dance:
      while(index >= 0){
         var opponentData = quickPlayUsers[index];
         if(opponentData.email !== data.email && opponentData.subject == data.subject){

              if(roomClients[data.email] == true){
                io.sockets.to(data.email).emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:opponentData.email, subject:data.subject, opponent:opponentData.user});
              }
              if(roomClients[opponentData.email] == true){
                io.sockets.to(opponentData.email).emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:data.email, subject:data.subject, opponent:data.user});
              }

            var userIndex = quickPlayUsers.indexOf(data);
            quickPlayUsers.splice(userIndex,1);
            quickPlayUsers.splice(index,1);
            console.log(quickPlayUsers);
            break dance;
         }else{
          index--;
         }
      }
    }
  });
  }

  socket.on('quitMatch', function(data){
    io.sockets.in(data.opponentEmail).emit('opponentQuit', {msg:'Your Opponent Forfeited the Match'});
    socket.leave(data.userEmail);
    socket.leave(data.opponentEmail);
  })

  socket.on('finishedGame', function(data){
    // socket.join(userEmail);
    var opponentEmail = data.opponentEmail;
    var userEmail = data.userEmail;
    var opponent = data.opponent;
    var user = data.user;

    //save the data to the user, containing right/wrong questions and user's score
    finishedUsers[userEmail] = data; 
    console.log(finishedUsers);
    //check if opponent has finished by seeing if it exists in finishedUsers array
    if(opponentEmail in finishedUsers){
      //report back to user that opponent finished
      var finishedOpponentData = finishedUsers[opponentEmail];
      io.sockets.in(userEmail).emit('opponentStatus', {msg:'Finished', opponentData: finishedOpponentData});

      //report to opponent that user is done
      io.sockets.to(opponentEmail).emit('opponentFinished', {score: data.score, wrongQuestions: data.wrongQuestions, rightQuestions: data.rightQuestions});

      //remove user and opponent from finishedUsers array, remove them from socket.io rooms
      delete finishedUsers[userEmail];
      delete finishedUsers[opponentEmail];
      console.log(finishedUsers);
      socket.leave(userEmail);
      socket.leave(data.email);
    }else{
      socket.emit('opponentStatus', {msg: 'Waiting'});
    }
  })

  socket.on('leaveRoom', function(data){
    socket.leave(data.email);
    socket.emit('leftRoomOnce', {});
    var userIndex = quickPlayUsers.indexOf(data);
    quickPlayUsers.splice(userIndex,1);
    roomClients[data.email] = false;
    delete roomClients[data.email];
    var clients = io.sockets.adapter.rooms[data.email];
    console.log(roomClients);
  })

});
