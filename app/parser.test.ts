import { describe, expect, test } from 'bun:test';

import { tokenizeArgs } from './parser.ts';

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
                console.log('xxx', tokenizeArgs("echo three\ \ \ spaces"));
                expect(tokenizeArgs("echo three\\ \\ \\ spaces")).toEqual(['echo', 'three   spaces']);
            });

        });

    });

});