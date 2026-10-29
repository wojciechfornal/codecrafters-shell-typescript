// Types
// These types will be used when I'll get to arguments parsing pipeline implementation in upcoming stage(s)
// The idea is to provide insights to command executor

export type TokenType = 'WORD' | 'PIPE' | 'REDIRECT_STDOUT' | 'APPEND_STDOUT' | 'REDIRECT_STDERR';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
}

export interface Redirection {
  type: 'stdout' | 'stderr' | 'stdout_append' | 'stderr_append';
  target: string;
}

export interface ParsedCommand {
  executable: string;
  args: string[];
  redirections: Redirection[];
}

// Functions

/**
 * Splits raw command arguments into an array of unqoted tokens.
 * Handles single quotes, double quotes, adjacent quotes, and empty quotes.
 * For example "path with spaces" dir2 dir3 becomes ['path with spaces', 'dir1', 'dir2']
 * @param argsRaw Raw arguments string
 * @returns Array of parsed argument tokens (strings)
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

/**
 * Low-level lexer producing typed tokens with operator and quote awareness.
 * @param argsRaw 
 * @returns An array of Tokens
 */
export function tokenize(argsRaw: string): Token[] {

  throw new Error("Not yet implemented");

}