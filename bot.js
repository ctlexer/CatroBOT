var Discord = require('discord.js');
var config = require('./config.json');
var sqlite3 = require("sqlite3");
var db = new sqlite3.Database('./db/catrobot.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the catroBOT database.');
});

// initialize Discord Bot
var bot = new Discord.Client();
bot.login(config.token);


bot.on('ready', () =>{
      //if the table does not exist, set it up
      db.prepare("CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, question TEXT NOT NULL, solved TEXT NOT NULL, post_date INTEGER);").run();
      db.prepare("CREATE TABLE IF NOT EXISTS interactions (user TEXT PRIMARY KEY NOT NULL, amount INTEGER);").run();
});

bot.on('error', console.error);

bot.on('message', (receivedMessage) => {
    //listen for messages that start with `!`
    if (receivedMessage.content.startsWith("!")) {
        var args = receivedMessage.content.substr(1).split(' ');
        var cmd = args[0];
        var args = args.slice(1);
        var args = args.join(' ');
        console.log("Command received: " + cmd);
        console.log("Arguments: " + args);

        //count user interaction
        db.all("SELECT user FROM interactions WHERE user = " + receivedMessage.author.id + ";", function(err, rows) {
          if (err) {
            throw err;
          }
          if (rows.length > 0){
            rows.forEach((row) => {
              db.all("UPDATE interactions SET amount = amount + 1 WHERE user = " + receivedMessage.author.id + ";", function(err, rows) {
                if (err) {
                  throw err;
                }
              });
            });
          }
          else {
            db.prepare("INSERT INTO interactions (user, amount) VALUES (?, 1);", receivedMessage.author.id).run();
          };
        });



        //clear out dead requests
        var interval = setInterval (function (){
          db.run("UPDATE requests SET solved = 'EXPIRED' WHERE date(post_date) <= date('now', '-5 day') AND solved = 'OPEN';", function(err, row) {
            if (err) {
              throw err;
            }
            if (this.changes > 0){
              console.log(this.changes + " requests have expired");
            }
          });
      }, 1000);

        var game_adjective = ['a thrilling', 'an exciting', 'a dashing', 'a fabulous'];
        var game_type = ['adventure', 'dexterity', 'jump & run', 'shooter', 'quiz', 'puzzle'];
        var topic_descriptor = ['space', 'unicorn', 'animal', 'dog', 'car', 'rocket', 'cat', 'cute'];
        var topic_noun = ['pirates', 'detectives', 'scientists', 'princesses', 'thieves', 'robots'];

        switch(cmd) {
          //outputs a random generated idea for a game
            case 'idea':
              var randomAdjective = game_adjective[Math.floor(Math.random()*game_adjective.length)];
              var randomType = game_type[Math.floor(Math.random()*game_type.length)];
              var randomDescriptor = topic_descriptor[Math.floor(Math.random()*topic_descriptor.length)];
              var randomNoun = topic_noun[Math.floor(Math.random()*topic_noun.length)];
              receivedMessage.channel.send('How about ' + randomAdjective + ' ' + randomType + '-game about ' + randomDescriptor + ' ' + randomNoun + '?');

            break;
            //sends a private message to a user explaining bot functionality
            case 'howto':
              receivedMessage.author.send('Hi I am Catrobot\! \n\ \n\My purpose is connecting people so they can enjoy coding together\! The way I work is that you can add a question to a public list, from where another user can then contact you privately to help you! Or you can look through open questions yourself and see whether you are able to help someone else with their problems.\n\n**By using this feature you agree that users can contact you on Discord via private messages. Catrobat takes not responsibility for any content of any private conversations this feature might initiate. If you feel harassed or uncomfortable immediately block the offending user and contact one of the admins.**\n\nThe following commands are available:\n\nPublic commands:\n\n\!howto \tBrings up this help dialog.\n\!idea \tGives you a fantastic idea for a game!\n\nPrivate commands:\n\n\!help\tShows all problems users currently need help with, feel free to contact them if you know how to help!\n\!ask [QUESTION]\tAdds your question to the list, so other users can contact you!\n\!solved\tMarks your question as solved so it will no longer show up for other users!\n\nPublic commands are available in all channels, private commands can only be used when talking to me privately (to avoid spamming the other users).\n\nPlease also fill out this feedback form https://forms.gle/biwpPj4onGxNENDr9 so we can improve CatroBot for you!');
            break;
            //brings up list of posted questions
            case 'help':
              if (receivedMessage.channel.type == 'dm'){
                db.each("SELECT user, question FROM requests WHERE solved = 'OPEN';", function(err, row) {
                  if (err) {
                    receivedMessage.channel.send("There has been an error, please re-send your command!");
                    throw err;
                  }
                  receivedMessage.channel.send('<@' + row.user + "> has asked: " + row.question);
                });
              }
              else {
                receivedMessage.channel.send('Please use this command in a private message!');
              };
            break;
            //allows user to add own questions
            case 'ask':
              if (receivedMessage.channel.type == 'dm'){
                  if (args.length < 1) {
                    receivedMessage.channel.send('Wrong format! Please ask your question again using "!ask [QUESTION]"');
                  } else {
                    //check if there is already an open question
                    db.all("SELECT question FROM requests WHERE user = " + receivedMessage.author.id + " AND solved = 'OPEN';", function(err, rows) {
                      if (err) {
                        receivedMessage.channel.send("There has been an error, please re-send your command!");
                        throw err;
                      }
                      if (rows.length > 0){
                        rows.forEach((row) => {
                          receivedMessage.channel.send('I am sorry, but you already have asked the question \"' + row.question + '\". Please use !solved to mark this question as solved. You may then ask a new one!');
                        });
                      }
                      else {
                        //if there is no open question add one to the list
                        db.prepare("INSERT INTO requests (user, question, solved, post_date) VALUES (?, ?, 'OPEN', CURRENT_TIMESTAMP);", receivedMessage.author.id, args).run();
                        receivedMessage.channel.send('You have added the question \"' + args + '\" to our database! If anyone wants to help you they may contact you via a private message!');
                      };
                    });
                  };
              }
              else {
                receivedMessage.channel.send('Please use this command in a private message!');
              };
            break;
            //marks open questions by this user as solved
            case 'solved':
            if (receivedMessage.channel.type == 'dm'){
              db.run("UPDATE requests SET solved = 'CLOSED' WHERE user = " + receivedMessage.author.id + " AND solved = 'OPEN';", function(err, row) {
                if (err) {
                  receivedMessage.channel.send("There has been an error, please re-send your command!");
                  throw err;
                }
                receivedMessage.channel.send("You closed " + this.changes + " question! Please also fill out this form https://forms.gle/biwpPj4onGxNENDr9 and tell us how you liked CatroBOT so far!");
              });
            }
            else {
              receivedMessage.channel.send('Please use this command in a private message!');
            };
            break;
            //unknown command
            default:
                receivedMessage.channel.send('I am sorry I did not understand your command, try !howto and I will answer you privately!');
            break;
         }
     }
});
