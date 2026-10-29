// Types
// These types will be used when I'll get to arguments parsing pipeline implementation in upcoming stage(s)
// The idea is to provide insights to command executor

export type TokenType =
  'WORD' | 'PIPE' | 'REDIRECT_STDOUT' | 'APPEND_STDOUT' | 'REDIRECT_STDERR';

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

// Globals

const OperatorTokenTypes: Record<string, TokenType> = {
  ['>']: 'REDIRECT_STDOUT',
  ['1>']: 'REDIRECT_STDOUT',
  ['>>']: 'APPEND_STDOUT',
  ['1>>']: 'APPEND_STDOUT',
};

// Functions

/**
 * Splits raw command arguments into an array of unqoted tokens.
 * Handles single quotes, double quotes, adjacent quotes, and empty quotes.
 * For example "path with spaces" dir2 dir3 becomes ['path with spaces', 'dir1', 'dir2']
 * @param argsRaw Raw arguments string
 * @returns Array of parsed argument tokens (strings)
 */
export function tokenizeArgs(argsRaw: string): string[] {
  let currentArgBuffer = '';
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
      currentArgBuffer += char;
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
        args.push(currentArgBuffer);
        currentArgBuffer = '';
        hasToken = false;
      }
    } else {
      currentArgBuffer += char;
      hasToken = true;
    }
  }

  if (hasToken) {
    args.push(currentArgBuffer);
  }

  return args;
}

/**
 * Low-level lexer producing typed tokens with operator and quote awareness.
 * @param argsRaw
 * @returns An array of Tokens
 */
export function tokenize(argsRaw: string): Token[] {
  let currentArgBuffer = '';
  let operatorBuffer = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inEscapeMode = false;
  let hasToken = false;
  let tokenType: TokenType;
  const tokens: Token[] = [];

  // TODO Types and type guards for operators
  const operators = ['|', '>'];
  // TODO Types and type guards for file descriptors
  const fileDescriptors = ['0', '1', '2'];

  for (let i = 0; i < argsRaw.length; i++) {
    const char = argsRaw[i];
    // TODO Escape behavior different when in single quote and in double quotes mode
    if (!inSingleQuote && !inEscapeMode && char === '\\') {
      inEscapeMode = true;
      // Potential redirect operator becomes invalid
      operatorBuffer = '';
      continue;
    }
    if (inEscapeMode) {
      inEscapeMode = false;
      continue;
    }
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      hasToken = true;
      // Potential redirect operator becomes invalid
      operatorBuffer = '';
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      hasToken = true;
      // Potential redirect operator becomes invalid
      operatorBuffer = '';
    } else if (
      !inDoubleQuote &&
      !inSingleQuote &&
      !inEscapeMode &&
      (operators.includes(char) || fileDescriptors.includes(char))
    ) {
      // Reference cases:
      // - echo hi > f
      //           ^
      // - echo hi 1> f
      // - echo hi>f
      // - > f echo pre
      const nextChar = i + 1 < argsRaw.length ? argsRaw[i + 1] : null;
      if (
        currentArgBuffer === '' ||
        fileDescriptors.includes(currentArgBuffer)
      ) {
        hasToken = true;
        // Just first redirect operator, alone or after file descriptor
        if (operators.includes(char)) {
          operatorBuffer += char;
          currentArgBuffer = operatorBuffer;
          if (nextChar === char) {
            // And eventually another one of the same type (append)
            operatorBuffer += char;
            currentArgBuffer = operatorBuffer;
            i++;
            continue;
          }
        }
        if (currentArgBuffer === '' && fileDescriptors.includes(char)) {
          // Just first file descriptor
          operatorBuffer += char;
          currentArgBuffer = operatorBuffer;
          if (operators.includes(nextChar ?? '')) {
            // And eventually another one of the same type (append)
            operatorBuffer += nextChar;
            currentArgBuffer = operatorBuffer;
            i++;
            continue;
          }
        }

        continue;
      }
    } else if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      let tokenType: TokenType = 'WORD';
      if (currentArgBuffer === operatorBuffer) {
        tokenType = OperatorTokenTypes[operatorBuffer];
      }
      if (hasToken) {
        tokens.push({
          type: tokenType,
          value: currentArgBuffer,
          raw: currentArgBuffer,
        });
        currentArgBuffer = '';
        hasToken = false;
      }
    } else {
      currentArgBuffer += char;
      hasToken = true;
    }
  }

  if (hasToken) {
    tokens.push({
      type: 'WORD',
      value: currentArgBuffer,
      raw: currentArgBuffer,
    });
  }

  return tokens;
}
