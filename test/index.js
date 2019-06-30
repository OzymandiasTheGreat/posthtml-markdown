/* eslint-disable no-undef */
import fs from 'fs';
import assert from 'assert';
import posthtml from 'posthtml';
import plugin from '../dist';


const fixture = (fileName) => fs.readFileSync(`${__dirname}/fixtures/${fileName}.html`).toString();
const writeOut = (fileName, content) => {
	if (!fs.existsSync(`${__dirname}/output/`)) fs.mkdirSync(`${__dirname}/output/`);
	fs.writeFileSync(`${__dirname}/output/${fileName}.html`, content);
};
const posthtmlOutput = async (fileName, options = {}) => (await posthtml(plugin(options)).process(fixture(fileName))).html;
const expect = (fileName) => fixture(`${fileName}.expect`);


describe('posthtml-markdown', () => {
	it('Matches posthtml-md', async () => {
		const file = 'posthtml-md';
		const output = await posthtmlOutput(file);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Has basic functionallity', async () => {
		const file = 'basic';
		const output = await posthtmlOutput(file);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Parses code block with html content', async () => {
		const file = 'html_code';
		const output = await posthtmlOutput(file);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Handle tables in overflow tags', async () => {
		const file = 'table';
		const output = await posthtmlOutput(file);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Works without options object', async () => {
		const file = 'no_options';
		const output = await posthtmlOutput(file, undefined);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Accepts custom options', async () => {
		const file = 'options';
		const output = await posthtmlOutput(file, {
			whitespace: '  ',
			breaks: true,
			headerIds: false,
		});
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});

	it('Handles blockquote correctly', async () => {
		const file = 'blockquote';
		const output = await posthtmlOutput(file);
		try {
			assert(output === expect(file));
		} catch (err) {
			writeOut(file, output);
			throw err;
		}
	});
});
