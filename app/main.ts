import { ChildProcess, spawn } from 'node:child_process';
import * as readline from 'node:readline/promises';
import * as process from 'node:process';
import { delimiter, join, normalize } from 'node:path';
import { accessSync, constants } from 'node:fs';
import { once } from 'node:events';

// Types

type CommandHandler = (argsRaw: string) => void;
type CommandRegistry = Record<string, CommandHandler>;
type TemplateStrings = Record<string, string>;

// Readline

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// Commands and commands' handlers

function cmdExit(): CommandHandler {
  return () => {
    process.exit(0);
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
        const { found, path } = cmdExistsAndExecutable(cmd);
        if (!found) {
          console.log(`${cmd}: not found`);
          return;
        }
        console.log(`${cmd} is ${path}`);
      }
    }
  }

}

function execCmd(cmd: string, args: string | string[]): ChildProcess {
  let argsArr: string[] = [];
  if (!Array.isArray(args)) {
    argsArr = args.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  }
  return spawn(cmd, argsArr, { stdio: 'inherit' });
}

const commandRegistry: CommandRegistry = {
  'echo': cmdEcho(),
  'exit': cmdExit(),
  'type': cmdType(),
};

// Program start
// Prompt loop

rl.prompt();

rl.on('line', async (input) => {

  const match = input.match(/^([^\s]+)(.*)$/);
  const cmd = match ? match[1] : '';
  const argsRaw = match ? match[2] : '';

  const handler = commandRegistry[cmd];

  let spawnedChildProcess: ChildProcess | null = null;

  if (handler) {
    handler(argsRaw);
  } else {
    const { found } = cmdExistsAndExecutable(cmd);
    if (!found) {
      console.log(`${cmd}: not found`);
      return;
    }
    spawnedChildProcess = execCmd(cmd, argsRaw);
    await once(spawnedChildProcess, 'close');
    spawnedChildProcess = null;
  }

  if (spawnedChildProcess === null) {
    rl.prompt();
  }  

});

// Close

rl.on('close', () => {
  process.exit(0);
});

// Utility functions
// =====================================================================================================================

// cmdExistsAndExecutable

type CmdExistsAndExecutableSuccess = {
  found: true,
  path: string,
};

type CmdExistsAndExecutableFailure = {
  found: false,
  path: null,
}

/**
 * Checks if a command exists in the system's PATH and is executable.
 * 
 * @param cmd - The name of the command to search for.
 * @returns An object indicating whether the command was found, and if so, its absolute path.
 */
function cmdExistsAndExecutable(cmd: string): CmdExistsAndExecutableSuccess | CmdExistsAndExecutableFailure {

  const PATH = process.env.PATH;
  const paths = PATH?.split(delimiter) ?? [];

  for (const dir of paths) {
    const fullPath = normalize(join(dir, cmd));
    try {
      accessSync(fullPath, constants.F_OK | constants.X_OK);
      return {
        found: true,
        path: fullPath
      }
    } catch {
      // If the file does not exist or lacks execute permissions, skip it
    }
  }

  return {
    found: false,
  };

}

// TODO Message generation based on interpolated template string
// TODO Wrapper around console