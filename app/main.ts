import * as readline from 'node:readline/promises';
import { exit, stdin as input, stdout as output } from 'node:process';
import { delimiter, join, normalize } from 'node:path';
import { accessSync, constants } from 'node:fs';

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
        const paths = PATH?.split(delimiter) ?? [];
        let found = false;
        for (const dir of paths) {
          const fullPath = normalize(join(dir, cmd));
          try {
            accessSync(fullPath, constants.F_OK | constants.X_OK);
            console.log(`${cmd} is ${fullPath}`);
            found = true;
            break;
          } catch {
            // If the file does not exist or lacks execute permissions, skip it
          }
        }
        
        if (!found) {
          console.log(`${cmd}: not found`);
        }
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