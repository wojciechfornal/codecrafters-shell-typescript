import * as readline from 'node:readline/promises';
import { exit, stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({
  input,
  output,
  prompt: "$ ",
});

rl.prompt();

rl.on('line', (input) => {

  const match = input.match(/^([^\s]+)(.*)$/);
  const cmd = match ? match[1] : '';
  const argsRaw = match ? match[2] : '';

  switch (cmd) {
    case 'echo':
      const outputStr = argsRaw.replace(/^\s/, '');
      console.log(outputStr);
      break;
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