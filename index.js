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
    console.log(quickPlayUsers);

    if(quickPlayUsers.length >1){
      var index = quickPlayUsers.length -1;
      dance:
      while(index >= 0){
         var opponentData = quickPlayUsers[index];
         if(opponentData !== data && opponentData.subject == data.subject){
            socket.emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:opponentData.email, subject:data.subject, opponent:opponentData.user});
            socket.broadcast.to(opponentData.email).emit('opponentFound', {msg: 'Opponent Found!', opponentEmail:data.email, subject:data.subject, opponent:data.user});
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

  socket.on('quitMatch', function(data){
    socket.broadcast.to(data.opponentEmail).emit('opponentQuit', {msg:'Your Opponent Forfeited the Match'});
    socket.leave(data.email);
    socket.leave(opponentData.email);
  })

  socket.on('finishedGame', function(data){
    socket.join(userEmail);
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
      socket.emit('opponentStatus', {msg:'Finished', opponentData: finishedOpponentData});

      //report to opponent that user is done
      socket.broadcast.to(opponentEmail).emit('opponentFinished', {score: data.score, wrongQuestions: data.wrongQuestions, rightQuestions: data.rightQuestions});
      socket.leave(userEmail);
      socket.leave(data.email);
    }else{
      socket.emit('opponentStatus', {msg: 'Waiting'});
    }
  })

  socket.on('leaveRoom', function(data){
    socket.leave(data.email);
  })
  
});
