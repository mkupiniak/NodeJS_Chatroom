'use strict';

function init() {
    var serverBaseUrl = document.domain;

    //On client init, try to connect to the socketIO server
    //Port is not specified because my server is set up to run on port 8080
    var socket = io.connect(serverBaseUrl);

    //Save session ID for later
    var sessionId = '';

    //Helper function to update the participants' list
    function updateParticipants(participants) {
        $('#participants').html('');
        for (let i in participants) {
            $('#participants').append('<span id="' + participants[i].id + '">' + participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /> </span>');
        }
    }

    /*
        When the client successfully connects to the server, an event "connect" is emitted. Get the session ID
        and log it. Also, let the socket.IO server there's a new user with a session ID and a name. Emit the "newUser" event fot that
    */
    socket.on('connect', function() {
        sessionId = socket.io.engine.id;
        console.log('Connected ' + sessionId);
        socket.emit('newUser', { id: sessionId, name: $('#name').val });
    });

    /*
        When the server emits the "newConnection" event, reset the participants section and display the connected
        clients. Assign the sessionId as the span ID.
    */
    socket.on('newConnection', function(data) {
        updateParticipants(data.participants);
    });

    /*
        When the server emits the 'userDisconnected' event, remove the span element from the participants element
    */
    socket.on('userDisconnected', function(data) {
        $('#' + data.id).remove();
    });

    /*
        When the server fires the "nameChanged" event, update the span with the given ID accordingly
    */
    socket.on('nameChanged', function(data) {
        $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br/>');
    });

    /*
        When receiving a new chat message with the 'incomingMessage' event, prepend it to the messages
        section
    */
    socket.on('incomingMessage', function(data) {
        var message = data.message;
        var name = data.name;
        $('#messages').prepend('<b>' + name + '</b><br/>' + message + '<hr />');
    });

    /*
        Log an error if unable to connect to server
    */
    socket.on('error', function(reason) {
        console.log('Unable to connect to server', reason);
    });

    /*
        "sendMessage" will do a simple ajax POST call to the server with whatever message there is in textarea
    */
    function sendMessage() {
        let outgoingMessage = $('#outgoingMessage').val();
        let name = $('#name').val();
        $.ajax({
            url: '/message',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ message: outgoingMessage, name: name })
        });
    }

    /*
        If user presses Enter key on textarea, call sendMessage if there is something to send
    */
    function outgoingMessageKeyDown(event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($('#outgoingMessage').val().trim().length <= 0) {
                return;
            }
            sendMessage();
            $('#outgoingMessage').val('');
        }
    }

    /*
        Helper function to disable / enable Send button
    */
    function outgoingMessageKeyUp() {
        var outgoingMessageValue = $('#outgoingMessage').val();
        $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true)
    }

    /*
        When a user updates his/her name, let the server know by emitting the 'nameChange' event
    */
    function nameFocusOut() {
        var name = $('#name').val();
        socket.emit('nameChange', { id: sessionId, name: name });
    }

    // Elements event listeners

    $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
    $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
    $('#name').on('focusout', nameFocusOut);
    $('#send').on('click', sendMessage);
}

$(document).on('ready', init);
