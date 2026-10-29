/**
 * Project: CodeCrafters - Build Your Own Shell (TypeScript)
 * Author: Wojciech Fornal <wojciech.fornal@gmail.com>
 *
 * This software is provided "as is", without warranty of any kind, express
 * or implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose, and noninfringement. In no event shall
 * the author bear any responsibility or be held liable for any claim, damages,
 * or other liability arising from, out of, or in connection with the software
 * or the use or other dealings in the software.
 */

import { ChildProcess, spawn } from 'node:child_process';
import { cwd } from 'node:process';
import * as readline from 'node:readline/promises';
import * as process from 'node:process';
import { delimiter, join, normalize } from 'node:path';
import { accessSync, constants } from 'node:fs';
import { once } from 'node:events';
import os from 'node:os';

import { tokenizeArgs } from './parser.ts';

// Types

type CommandHandler = (argsRaw?: string) => void;
type CommandRegistry = Record<string, CommandHandler>;

type CmdExistsAndExecutableSuccess = {
  found: true;
  path: string;
};

type CmdExistsAndExecutableFailure = {
  found: false;
  path: null;
};

type SystemError = NodeJS.ErrnoException & { code: string };

// Type guards

/**
 * In Node.js, system and I/O operations (like process.chdir, fs.readFile, etc.) throw what Node internally calls a
 * SystemError. At runtime, these errors are instances of the standard JavaScript Error with some extra properties
 * attached.
 * @param error
 * @returns true if the error object is of type Error with additional 'code' property
 */
const isSystemError = (error: unknown): error is SystemError => {
  return (
    error instanceof Error && 'code' in error && typeof error.code === 'string'
  );
};

// Readline

// TODO Workaround for multiple readline listeners when app is run with Bun's hot reload (--hot)

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '$ ',
});

// Commands and commands' handlers

/**
 * 'cd' command implementation.
 * Delegates to process.chdir to change the current working directory.
 * @returns A CommandHandler that changes the current working directory.
 */
function cmdCd(): CommandHandler {
  return (argsRaw) => {
    // If no path given, just behave like "normal" cd by changing working directory to user's home directory
    if (!argsRaw || !argsRaw.trim()) {
      process.chdir(os.homedir());
      return;
    }

    const args = tokenizeArgs(argsRaw);
    const path = args[1];

    if (path === '~') {
      process.chdir(os.homedir());
      return;
    }

    try {
      process.chdir(path);
    } catch (e) {
      if (isSystemError(e)) {
        switch (e.code) {
          // ENOENT: no such file or directory
          case 'ENOENT':
            console.log(`cd: ${path}: No such file or directory`);
            return;
          default:
            console.log(`cd: ${e.message}`);
            break;
        }
      }
    }
  };
}

/**
 * 'exit' command implementation.
 * @returns
 */
function cmdExit(): CommandHandler {
  return () => {
    process.exit(0);
  };
}

/**
 * 'echo' command implementation.
 * @returns
 */
function cmdEcho(): CommandHandler {
  return (argsRaw) => {
    const args = tokenizeArgs(argsRaw ?? '');
    console.log(args.slice(1).join(' '));
  };
}

/**
 * 'pwd' command implementation.
 * @returns
 */
function cmdPwd(): CommandHandler {
  return (_argsRaw) => {
    console.log(cwd());
  };
}

/**
 * 'type' command implementation.
 * @returns
 */
function cmdType(): CommandHandler {
  return (argsRaw) => {
    const args = tokenizeArgs(argsRaw ?? '');
    const cmds = args.slice(1);

    for (const cmd of cmds ?? []) {
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
  };
}

/**
 * Runs external executables
 * @param cmd
 * @param args
 * @returns
 */
function execCmd(
  cmd: string,
  executablePath: string | null,
  args: string[],
): ChildProcess {
  return spawn(cmd, args, { stdio: 'inherit' });
}

// TODO Consider command registration by commandRegistry.registerCmd(...)
// TODO Maybe the whole command registry should be moved to another file and imported
const commandRegistry: CommandRegistry = {
  cd: cmdCd(),
  echo: cmdEcho(),
  exit: cmdExit(),
  pwd: cmdPwd(),
  type: cmdType(),
};

// Program start
// Prompt loop

rl.prompt();

rl.on('line', async (input) => {
  const trimmed = input.trim();

  if (!trimmed) {
    rl.prompt();
    return;
  }

  const [cmd, ...args] = tokenizeArgs(trimmed);

  const handler = commandRegistry[cmd];
  let spawnedChildProcess: ChildProcess | null = null;

  if (handler) {
    // TODO Lexing and parsing should probably happen in one place and not in each handler
    // TODO Do not pass raw trimmed input but what comes from tokenizer instead
    handler(trimmed);
  } else {
    const { found, path } = cmdExistsAndExecutable(cmd);
    if (!found) {
      console.log(`${cmd}: not found`);
    } else {
      spawnedChildProcess = execCmd(cmd, path, args);
      await once(spawnedChildProcess, 'close');
      spawnedChildProcess = null;
    }
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

/**
 * Checks if a command exists in the system's PATH and is executable.
 *
 * @param cmd - The name of the command to search for.
 * @returns An object indicating whether the command was found, and if so, its absolute path.
 */
function cmdExistsAndExecutable(
  cmd: string,
): CmdExistsAndExecutableSuccess | CmdExistsAndExecutableFailure {
  const PATH = process.env.PATH;
  const paths = PATH?.split(delimiter) ?? [];

  for (const dir of paths) {
    const fullPath = normalize(join(dir, cmd));
    try {
      accessSync(fullPath, constants.F_OK | constants.X_OK);
      return {
        found: true,
        path: fullPath,
      };
    } catch {
      // Just skip files that do not exist or can't be executed
    }
  }

  return {
    found: false,
    path: null,
  };
}

// TODO Message generation with the use of template strings
// TODO Wrapper around console
// TODO Utility to parse / sanitize / normalize argsRaw
