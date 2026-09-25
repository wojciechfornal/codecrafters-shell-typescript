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
  console.log(`${cmd}: command not found`);
  rl.prompt();
});

rl.on('close', () => {
  console.log('Bye');
  exit(0);
});