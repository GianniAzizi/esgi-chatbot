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

var savedAddress;

var bot = new botbuilder.UniversalBot(connector, function(session){
    savedAddress = session.message.address;
    session.send(`Vous avez écrit : ${session.message.text} | [Longueur du texte : ${session.message.text.length}]`);
});

bot.on('typing', function(){
    bot.send(new botbuilder.Message()
        .address(savedAddress)
        .text('Vous êtes en train d\'écrire'));
});

bot.on('conversationUpdate', function(message){
    savedAddress = message.address;
    var isBot = (message.membersAdded && message.membersAdded.length == 1) ? 
        message.membersAdded[0].id === message.address.bot.id : false; 
    if(!isBot) {
        if(message.membersAdded && message.membersAdded.length > 0) {
            var membersAdded = message.membersAdded
            .map(function(x) {
                var isSelf = x.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : x.name) || ' ' + '(Id = ' + x.id + ')';
            }).join(', ');
            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Bienvenue ' + membersAdded + ' !'));
            bot.beginDialog(message.address, '/first');
        }

        if (message.membersRemoved && message.membersRemoved.length > 0) {
            console.log(message.membersRemoved);
            var membersRemoved = message.membersRemoved
                .map(function (m) {
                    var isSelf = m.id === message.address.bot.id;
                    return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
                })
                .join(', ');

            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Au revoir ' + membersRemoved + '!'));
        }    
    }
});

bot.on('contactRelationUpdate', function(message){
    if(message.action && message.action === 'add') {
        bot.send(new botbuilder.Message()
        .address(message.address)
        .text('Le bot ' + message.address.bot.name + ' (Id: ' + message.address.bot.id + ') a rejoint la conversation'));
    }

    if(message.action && message.action === 'remove') {
        bot.send(new botbuilder.Message()
        .address(message.address)
        .text('Le bot ' + message.address.bot.name + ' (Id: ' + message.address.bot.id + ') a quitté la conversation'));    
    }
});

bot.dialog('/first', [
    (session) => {
        botbuilder.Prompts.text(session, 'Avez-vous une question ?');
    },
    (session, results) => {
        session.send('Je ne suis pas encore assez intélligent pour répondre à cette question :( ');
    }
]);