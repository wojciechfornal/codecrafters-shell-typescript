/**
 * Splits raw command arguments into an array of unqoted tokens.
 * Handles single quotes, double quotes, adjacent quotes, and empty quotes.
 * For example "path with spaces" dir2 dir3 becomes ['path with spaces', 'dir1', 'dir2']
 * @param argsRaw Raw arguments string
 * @returns Array of parsed argument tokens
 */
export function tokenizeArgs(argsRaw: string): string[] {
  let currentArg = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inEscapeMode = false;
  let hasToken = false;
  const args: string[] = [];

  for (let i = 0; i < argsRaw.length; i++) {
    const char = argsRaw[i];
    if (!inSingleQuote && !inEscapeMode && char === '\\') {
      inEscapeMode = true;
      continue;
    }
    if (inEscapeMode) {
      currentArg += char;
      inEscapeMode = false;
      continue;
    }
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      hasToken = true;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      hasToken = true;
    } else if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (hasToken) {
        args.push(currentArg);
        currentArg = '';
        hasToken = false;
      }
    } else {
      currentArg += char;
      hasToken = true;
    }
  }

  if (hasToken) {
    args.push(currentArg);
  }

  return args;
}
