import * as readline from 'node:readline/promises';
import { exit, stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({
  input,
  output,
  prompt: "$ ",
});

rl.prompt();

rl.on('line', (input) => {

  const [cmd, ...args] = input.trim().split(" ");

  switch (cmd) {
    case 'exit':
      exit(0);
    default:
      console.log(`${cmd}: command not found`);
      break;
  }
  
  rl.prompt();
  
});

rl.on('close', () => {
  exit(0);
});