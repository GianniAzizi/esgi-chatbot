var restify = require('restify');
var botbuilder = require('botbuilder');

// setup restify server

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function(){
    console.log('%s bot started at %s', server.name, server.url);
});

// create chat connector

var connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

// Listening for user input

server.post('/api/messages', connector.listen());

// Reply by echoing

var bot = new botbuilder.UniversalBot(connector, function(session){

    session.send(`You have tapped : ${session.message.text} | [length : ${session.message.text.length}]`);
    session.send(`Type : ${session.message.type}`);

    bot.on('typing', function(){
        session.send('Ma grand mère écrit plus vite que toi');
    });

    bot.on('conversationUpdate', function(message){
        if(message.membersAdded && message.membersAdded.length > 0) {
            session.send('Bonjour ! Vous pouvez me poser des questions');
        }
    });

});

