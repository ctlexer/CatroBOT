#CatroBOT

## About

CatroBOT a simple Discord bot for the Catrobat Discord server.

## Features

CatroBOT allows the users to ask questions related to PocketCode, and others to find and answer these questions.

The available commands are as follows:
- '!howto' Outputs available commands to the user privately.
- '!idea' Outputs a randomly generated project idea to a public channel.
- '!help' Shows all questions askes by users stored in the database.
- '!ask [QUESTION]' Adds a question to the list.
- '!solved' Marks a question as resolved.

## Installation

Make sure you have downloaded and installed:
 * Node.js
 * NPM

Clone this repository `git clone https://github.com/ctlexer/CatroBOT.git`.

Next run the following commands:
```
cd CatroBOT
npm install
```

This will install all the correct dependencies needed for the bot to run.

## Configuring the config file

Find the file `config.json` and enter your Discord-bot-token. For more information on this see the Discord developers docs https://discord.com/developers/ . A valid Discord account is required for this.

## Running the bot
Once the token has been entered the bot can be started.
```
node bot.js
```
