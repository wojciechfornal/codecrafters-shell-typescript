import * as readline from 'node:readline/promises';
import { exit, stdin as input, stdout as output } from 'node:process';

// Types

type CommandHandler = (argsRaw: string) => void;
type CommandRegistry = Record<string, CommandHandler>;
type TemplateStrings = Record<string, string>;

// Template strings
// TODO: Template strings

// Readline

const rl: readline.Interface = readline.createInterface({
  input,
  output,
  prompt: "$ ",
});

// Commands and commands' handlers

function cmdExit(): CommandHandler {
  return () => {
    exit(0);
  };
}

function cmdEcho(): CommandHandler {
  return (argsRaw) => {
    const outputStr = argsRaw?.replace(/^\s/, '');
    console.log(outputStr);
  };
}

function cmdType(): CommandHandler {
  return (argsRaw) => {
    const cmds = argsRaw?.trim().split(' ');
    for (const cmd of cmds) {
      if (cmd in commandRegistry) {
        console.log(`${cmd} is a shell builtin`);
      } else {
        console.log(`${cmd}: not found`);
      }
    }
  }
}

const commandRegistry: CommandRegistry = {
  'echo': cmdEcho(),
  'exit': cmdExit(),
  'type': cmdType(),
};

// Prompt loop

rl.prompt();

rl.on('line', (input) => {

  const match = input.match(/^([^\s]+)(.*)$/);
  const cmd = match ? match[1] : '';
  const argsRaw = match ? match[2] : '';

  const handler = commandRegistry[cmd];

  if (handler) {
    handler(argsRaw);
  } else {
    console.log(`${cmd}: command not found`);
  }
  
  rl.prompt();

});

// Close

rl.on('close', () => {
  exit(0);
});

// Utility functions

// TODO: Message generation based on interpolated template string