import parser from 'posthtml-parser';
import render from 'posthtml-render';
import matcher from 'posthtml-match-helper';
import marked from 'marked';


export default ({whitespace = '\t', ...options}) => ((tree) => {
	const replaced = ['markdown', 'md', 'pre'];
	const stripped = ['a', 'abbr', 'address', 'b','bdo', 'bdi', 'button', 'cite', 'data', 'details', 'dfn', 'em', 'fieldset', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'kbd', 'label', 'mark', 'p', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time'];
	const indentation = typeof whitespace === 'string'
		? whitespace
		: typeof whitespace === 'number'
			? ' '.repeat(whitespace)
			: typeof whitespace === 'boolean' && whitespace === true
				? '\t'
				: false;

	const preserveWhitespace = (string, newline) => {
		// If line consists of whitespace only, consider it empty
		const empty = (line) => /^\s*$/.test(line);
		// Calculate indentation level
		const indent = (line) => {
			const space = /^\r?\n?([ \t]*)/.exec(line);
			if (space && space.length) return space[0].split(indentation).length - 1;
			return 0;
		};
		// Whitespace following final line break is the indentation for
		// the closing tag, so preserve it
		const trail = (body) => {
			const space = /(\r?\n?[ \t]+)$/gm.exec(body);
			if (space && space.length) return space.pop();
			return '';
		};
		// Line numbering changes after conversion to markdown, so try to
		// generate a unique identifier for the line based on (content - markup)
		const tokenize = (line) => {
			const token = line.replace(/(<.+?>)|(#|\*|_|-|>|!)|(\(.+?\))|(\[|\])|\s/g, '');
			if (token) return token;
			else if (!empty(line)) return line;
			return '';
		};
		const prepend = {};
		const trimmed = [];
		for (let line of string.split(newline)) {
			prepend[tokenize(line)] = indent(line);
			trimmed.push(line.trim());
		}

		const processed = marked(trimmed.join(newline), options);
		const restored = [];
		let currIndent = 0;
		for (let line of processed.split(newline)) {
			if (!empty(line)) {
				if (Object.keys(prepend).includes(tokenize(line))) {
					currIndent = prepend[tokenize(line)] || currIndent;
				}
				restored.push(`${indentation.repeat(currIndent)}${line}`);
			}
		}
		return restored[0].startsWith(indentation)
			? `\n${restored.join(newline)}${trail(string)}`
			: `${restored.join(newline)}${trail(string)}`;
	};

	const discardWhitespace = (string, newline) => {
		const trimmed = [];
		for (let line of string.split(newline)) {
			trimmed.push(line.trim());
		}
		return marked(trimmed.join(newline), options).replace(new RegExp(newline, 'gm'), '');
	};

	return new Promise((resolve) => {
		tree.match(matcher('md, markdown, [md], [markdown]'), (node) => {
			let html = render(node.content);
			// Fix for blockquotes, restore '>' characters
			html = html.replace(/(?<=\s)&gt;/gm, '>');
			// Detect line endings
			const newline = html.includes('\r') && html.split('\r\n').length === html.split('\n').length
				? '\r\n'
				: '\n';
			let markdown = whitespace
				? preserveWhitespace(html, newline)
				: discardWhitespace(html, newline);
			if (stripped.includes(node.tag)
					|| (node.tag === 'pre'
					&& !(Object.keys(node.attrs).includes('md')
					|| Object.keys(node.attrs).includes('markdown')))) {
				markdown = markdown
					// remove paragraphs from inline tags
					.replace(/(<\/?p>)/g, '')
					// normalize whitespace
					.replace(/(?<=\S)\s+(?=\S)/g, ' ')
					.trim();
			} else if (replaced.includes(node.tag)) {
				// Since we're removing the parent tag
				// remove extra indentation
				markdown = markdown.trim();
			} else if (!(/^\s/g.test(markdown)) && node.content.length === 1) {
				const prevIndent = /^(\s+)/g.exec(node.content[0]) || [];
				markdown = `${prevIndent[0]}${markdown}`;
			}
			// Fix for blockquotes, return remaining '>' characters to entities
			markdown = markdown.replace(/(?<=<)(.+?)(&gt;)/gm, '$1>');
			const newNode = parser(markdown);
			node.content = newNode;
			if (replaced.includes(node.tag)) {
				// Remove tag
				node.tag = false;
			} else {
				// Make sure custom attributes don't end up in output
				node.attrs.md = false;
				node.attrs.markdown = false;
			}
			return node;
		});
		resolve(tree);
	});
});
