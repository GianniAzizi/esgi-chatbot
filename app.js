const restify = require('restify');
const botbuilder = require('botbuilder');

// setup restify server

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log('%s bot started at %s', server.name, server.url);
});

// create chat connector

const connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

// Listening for user input

server.post('/api/messages', connector.listen());

// Reply by echoing

var mainMenu = {
    "Creer une alarme" : {
        "choice": "create"
    },
    "Afficher les alarmes actives" : {
        "choice": "showActive"
    },
    "Afficher toutes les alarmes": {
        "choice": "showAll"
    }
}

let bot = new botbuilder.UniversalBot(connector, [
    function(session) {
        session.beginDialog('mainMenu');
    }
]);

let alarms = [];

bot.dialog('mainMenu', [
    function(session) {
        botbuilder.Prompts.choice(session, 'Faites votre choix : ', mainMenu, {
            listStyle: botbuilder.ListStyle["button"]
        });    
    },
    function(session, results) {
        session.beginDialog(mainMenu[results.response.entity].choice);
    } 
]);

bot.dialog('create', [
    function(session, args, next) {
        session.dialogData.alarm = args || {};
        if(!session.dialogData.alarm.name) {
            botbuilder.Prompts.text(session, "Très bien, quel nom porte votre alarme ?");
        }else{
            next();
        }     
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.name = results.response;
        }

        if(!session.dialogData.alarm.date) {
            botbuilder.Prompts.time(session, "Ok, à quelle date et heure dois-je créer l'alarme " + session.dialogData.alarm.name + " ?");            
        }else{
            next();
        }
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.time = botbuilder.EntityRecognizer.resolveTime([results.response]);
        }

        if(!session.dialogData.alarm.active) {
            botbuilder.Prompts.confirm(session, "Voulez vous activer cette alarme ?");
        }
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.active = results.response;
        }

        let alarm = {
            "name" : session.dialogData.alarm.name,
            "time" : session.dialogData.alarm.time,
            "active" : session.dialogData.alarm.active
        }
        
        if(alarm.name && alarm.time) {
            
            alarms.push(alarm);
            session.userData.alarms = alarms;

            session.send('Votre alarme ' + alarm.name + ' a été ajoutée !');
            session.replaceDialog('mainMenu');
        }else{
            session.replaceDialog('create');
        }
        
    }
])
.reloadAction(
    "restart", "",
    {
        matches: /^recommencer$/i,
        confirmPrompt: "Cela va annuler l'alarme en cours, êtes vous sur ?"
    }
)
.cancelAction(
    "cancel", "Très bien j'ai annulé la création de l'alarme", 
    {
        matches: /^annuler$/i,
        confirmPrompt: "Êtes vous sur de vouloir annuler ?"
    }
);



bot.dialog('showAll', [
    function(session) {
        let message = "Voici vos alarmes : <br/>"

        if(session.userData.alarms) {
            for(let alarm of session.userData.alarms) {
                console.log(alarm);
                let isActivated = (alarm.active) ? "Active" : "Inactive";
    
                message += "- " + alarm.name + " : " + alarm.time + " | " + isActivated + " <br/>";
            }
    
            session.send(message);
            session.replaceDialog('mainMenu');
        }else{
            session.send('Vous n\'avez pas d\'alarmes');
            session.replaceDialog('mainMenu');
        }    
    }
]);


bot.dialog('showActive', [
    function(session) {
        let message = "Voici vos alarmes : <br/>"

        if(session.userData.alarms) {
            for(let alarm of session.userData.alarms) {
                if(alarm.active) {
                    message += "- " + alarm.name + " : " + alarm.time + "<br/>";
                }
            }
    
            session.send(message);
            session.replaceDialog('mainMenu');
        }else{
            session.send('Vous n\'avez pas d\'alarmes actives');
            session.replaceDialog('mainMenu');
        }
    }
]);

bot.on('conversationUpdate', function(message){
    savedAddress = message.address;
    let isBot = (message.membersAdded && message.membersAdded.length == 1) ? 
        message.membersAdded[0].id === message.address.bot.id : false; 
    if(!isBot) {
        if(message.membersAdded && message.membersAdded.length > 0) {
            let membersAdded = message.membersAdded
            .map(function(x) {
                let isSelf = x.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : x.name) || ' ' + '(Id = ' + x.id + ')';
            }).join(', ');
            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Bienvenue !'));
            bot.beginDialog(message.address, 'mainMenu');
        }

        if (message.membersRemoved && message.membersRemoved.length > 0) {
            console.log(message.membersRemoved);
            let membersRemoved = message.membersRemoved
                .map(function (m) {
                    let isSelf = m.id === message.address.bot.id;
                    return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
                })
                .join(', ');

            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Au revoir ' + membersRemoved + '!'));
        }    
    }
});
