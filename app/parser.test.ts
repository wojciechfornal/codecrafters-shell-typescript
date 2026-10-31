import { describe, expect, test } from 'bun:test';

import type { Token } from './parser.ts';
import { tokenize, tokenizeArgs } from './parser.ts';

describe('parser', () => {

    describe('tokenizeArgs()', () => {

        // Test cases are mostly based on stories/requirements from CodeCrafters

        // Basic unqoted arguments

        test('handles basic unqoted arguments', () => {
            expect(tokenizeArgs('echo hello world')).toEqual(['echo', 'hello', 'world']);
        });

        test('consecutive spaces are collapsed unless quoted', () => {
            expect(tokenizeArgs('echo hello    world')).toEqual(['echo', 'hello', 'world']);
        });

        // Single quotes

        describe('Single Quotes', () => {

            test('preserves whitespace within single quotes', () => {
                expect(tokenizeArgs("echo 'hello   world")).toEqual(['echo', 'hello   world']);
            });

            test('concatenates adjacent quotes', () => {
                expect(tokenizeArgs("echo 'hello''world'")).toEqual(['echo', 'helloworld']);
            });

            test('concatenates adjacent quotes', () => {
                expect(tokenizeArgs("echo 'hello'''world'")).toEqual(['echo', 'helloworld']);
            });

            test('concatenates adjacent quotes', () => {
                expect(tokenizeArgs("echo 'hello''''world'")).toEqual(['echo', 'helloworld']);
            });

            test('empty quotes \'\' are ignored', () => {
                expect(tokenizeArgs("echo hello''world")).toEqual(['echo', 'helloworld']);
            });

        });

        // Double quotes

        describe('Double Quotes', () => {

            test('preserves whitespace within double quotes', () => {
                expect(tokenizeArgs('echo "hello   world"')).toEqual(['echo', 'hello   world']);
            });

            test('quoted strings next to each other are concatenated', () => {
                expect(tokenizeArgs('echo "hello""world"')).toEqual(['echo', 'helloworld']);
            });

            test('quoted and unqoted strings next to each other are concatenated', () => {
                expect(tokenizeArgs('echo "hello"world')).toEqual(['echo', 'helloworld']);
            });

            test('separate arguments can be quoted', () => {
                expect(tokenizeArgs('echo "hello" "world')).toEqual(['echo', 'hello', 'world']);
            });

            test('single quotes inside are literal', () => {
                expect(tokenizeArgs('echo "shell\'s test"')).toEqual(['echo', 'shell\'s test']);
            });

        });

        // Backslash Escaping

        describe('Backslash Escaping', () => {

            test('Each \\  creates a literal space as part of one argument.', () => {
                expect(tokenizeArgs("echo three\\ \\ \\ spaces")).toEqual(['echo', 'three   spaces']);
            });

            // TODO Add remaining tests for Backslash Escaping

        });

    });

    describe('tokenize()', () => {

        test('tokenizer produces two WORD tokens', () => {
            const argsRaw = 'echo hello';
            const expectedResult: Token[] = [];
            expectedResult.push({ type: 'WORD', value: 'echo', raw: 'echo' });
            expectedResult.push({ type: 'WORD', value: 'hello', raw: 'hello' });
            const tokenizeResult = tokenize(argsRaw);
            expect(tokenizeResult).toBeArray();
            expect(tokenizeResult).toBeArrayOfSize(2);
        });

        test('tokenizer produces WORDS and REDIRECT_STDOUT', () => {
            const argsRaw = 'echo hi > f';
            const expectedResult: Token[] = [];
            expectedResult.push({ type: 'WORD', value: 'echo', raw: 'echo' });
            expectedResult.push({ type: 'WORD', value: 'hi', raw: 'hi' });
            expectedResult.push({ type: 'REDIRECT_STDOUT', value: 'f', raw: 'f' });
            const tokenizeResult = tokenize(argsRaw);
            expect(tokenizeResult).toBeArray();
            expect(tokenizeResult).toBeArrayOfSize(4);
            expect(tokenizeResult[2].type).toEqual('REDIRECT_STDOUT');
            expect(tokenizeResult[2].value).toEqual('>');
        });

        test('tokenizer produces WORDS and REDIRECT_STDOUT with file descriptor', () => {
            const argsRaw = 'echo hi 1> f';
            const expectedResult: Token[] = [];
            expectedResult.push({ type: 'WORD', value: 'echo', raw: 'echo' });
            expectedResult.push({ type: 'WORD', value: 'hi', raw: 'hi' });
            expectedResult.push({ type: 'REDIRECT_STDOUT', value: '>', raw: '>' });
            expectedResult.push({ type: 'WORD', value: 'f', raw: 'f' });
            const tokenizeResult = tokenize(argsRaw);
            expect(tokenizeResult).toBeArray();
            expect(tokenizeResult).toBeArrayOfSize(4);
            expect(tokenizeResult[2].type).toEqual('REDIRECT_STDOUT');
            expect(tokenizeResult[2].value).toEqual('1>');
        });

        test('operators do not require whitespace - echo hi>out', () => {
            const argsRaw = 'echo hi>out';
            const expetedResult: Token[] = [];
            expetedResult.push({ type: 'WORD', value: 'echo', raw: 'echo' });
            expetedResult.push({ type: 'WORD', value: 'hi', raw: 'hi' });
            expetedResult.push({ type: 'REDIRECT_STDOUT', value: '1', raw: '1' });
            expetedResult.push({ type: 'WORD', value: 'out', raw: 'out' });
            const tokenizeResult = tokenize(argsRaw);
            expect(tokenizeResult).toBeArray();
            expect(tokenizeResult).toBeArrayOfSize(4);
            expect(tokenizeResult[2].type).toEqual('REDIRECT_STDOUT');
            expect(tokenizeResult[2].value).toEqual('>');
            expect(tokenizeResult[3].type).toEqual('WORD');
            expect(tokenizeResult[3].value).toEqual('out');
        });

        // TODO test case: file descriptors are recognized when not whitespace - echo hi2>out

    });

});