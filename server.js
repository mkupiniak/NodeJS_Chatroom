var express = require('express'); // include express module
var app = express(); // creates an Express application
var http = require('http').createServer(app); // returns a new instance of http.Server
var bodyParser = require('body-parser'); // include body parser
var io = require('socket.io').listen(http);
var _ = require('underscore');

// --- The list of participants in chatroom --- //
// the format of each participant will be:
// {
//    id: "sessionId",
//    name: "participantName"   
// }
var participants = [];

// --- Server config --- //

// Server's IP
app.set('ipaddr', '127.0.0.1'); //assigns name = 'ipaddr' to value = '127.0.0.1'

// Server's port number
app.set('port', 8080);

// Lets the server know about views folder
app.set('views', __dirname + '/views');

// View engine is Jade
app.set('view engine', 'jade');

// Specify where the static content is
app.use(express.static('public', __dirname + '/public'));

// Tells server to support JSON requests
app.use(bodyParser.json());

/* 
    --- Server routing --- 
*/

// Respond with 'Server is up and running!' when a GET request is made to the homepage
app.get('/', function(request, response) {

    // Render the view called 'index'
    response.render('index');
});

// POST method to create a chat message
app.post('/message', function(request, response) {
    console.log(request);
    // The request body expects a param named 'message'
    var message = request.body.message;

    // If the message is empty or wasn't sent it's a bad request
    if (_.isUndefined(message) || _.isEmpty(message.trim())) {
        return response.json(400, { error: "Message is invalid" });
    }

    // Expect the sender's name with the message
    var name = request.body.name;

    //Let chatroom know there was a new message
    io.sockets.emit('incomingMessage', { message: message, name: name });

    //If it's OK let the client know
    response.json(200, { message: 'Message received!' });

});

/* 
    --- Socket.IO events --- 
*/

io.on('connection', function(socket) {
    /*
        When a new user connects to server, expect an event called "newUser"
        and then emit an event called "new Connection" with a list of all participants
        to all connected clients
    */
    socket.on('newUser', function(data) {
        participants.push({ id: data.id, name: data.name });
        io.sockets.emit('newConnection', { participants: participants });
    });

    /*
        When a user changes their name, expect an event called "nameChange"
        and then emit an event called "nameChanged" to all participants with the id
        and new name of the user who emitted the original message
    */
    socket.on('nameChange', function(data) {
        _.findWhere(participants, { id: socket.id }).name = data.name;
        io.sockets.emit('nameChanged', { id: data.id, name: data.name });
    });

    /*
        When a client disconnects from the server, the event 'disconnect' is automatically
        captured by the server. It will then emit an event called "userDisconnected" to
        all participants with the id of the client that disconnected
    */
    socket.on('disconnect', function() {
        participants = _.without(participants, _.findWhere(participants, { id: socket.id }));
        io.sockets.emit('userDisconnected', { id: socket.id, sender: 'system' });
    });

});


// Start the http server at port and IP defined before
http.listen(app.get('port'), app.get('ipaddr'), function() {
    console.log('Server up and running. Go to http://' + app.get('ipaddr') + ':' + app.get('port'));
});
