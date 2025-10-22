import { expect, test } from 'bun:test';
import { configurationSchema, convert } from '../src';

test('exports should be defined', () => {
	expect(convert).toBeDefined();
	expect(configurationSchema).toBeDefined();
});
