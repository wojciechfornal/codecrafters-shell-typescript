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
        const PATH = process.env.PATH;
        const paths = PATH?.split(';') ?? [];
        for (const path of paths) {
          console.log('searching path: ' + path);
        }
        // TODO Perform path normalization if necessary
        // TODO Check if command (file) exists in path
        // TODO Check if command (file) has execute permissions
        // TODO If the file exists and has execute permissions, print "<command> is in <full_path>"
        // TODO If the file exists but lacks execute permissions, skip it and continue to the next directory
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

// TODO Message generation based on interpolated template string
// TODO Wrapper around console