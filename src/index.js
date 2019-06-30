import parser from 'posthtml-parser';
import render from 'posthtml-render';
import matcher from 'posthtml-match-helper';
import marked from 'marked';
import unescape from 'lean-he/decode';


export default ({whitespace = '\t', ...options} = {}) => ((tree) => {
	const replaced = ['markdown', 'md', 'pre'];
	const stripped = ['a', 'abbr', 'address', 'b','bdo', 'bdi', 'button', 'cite', 'data', 'details', 'dfn', 'em', 'fieldset', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'kbd', 'label', 'mark', 'p', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time'];
	const indentation = typeof whitespace === 'string'
		? whitespace || '\t'
		: '\t';

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
		let pre = false;
		let currIndent = 0;
		for (let line of processed.split(newline)) {
			if (!empty(line)) {
				if (line.includes('<pre>')) pre = true;
				if (Object.keys(prepend).includes(tokenize(line))) {
					currIndent = prepend[tokenize(line)] || currIndent;
				}
				if (pre) restored.push(line);
				else restored.push(`${indentation.repeat(currIndent)}${line}`);
				if (line.includes('</pre>')) pre = false;
			}
		}
		return restored[0].startsWith(indentation)
			? `\n${restored.join(newline)}${trail(string)}`
			: `${restored.join(newline)}${trail(string)}`;
	};

	const revertEntities = (node) => {
		if (node.content) {
			for (let i = 0; i < node.content.length; i++) {
				let line = node.content[i];
				if (typeof line === 'string') node.content[i] = unescape(line);
				else {
					node.content[i] = revertEntities(line);
				}
			}
			return node;
		} else if (typeof node === 'string') {
			return unescape(node);
		}
		return node;
	};

	return new Promise((resolve) => {
		tree.match(matcher('md, markdown, [md], [markdown]'), (node) => {
			// Fix for blockquotes and raw html
			const html = unescape(render(node.content));
			const newline = html.includes('\r') && html.split('\r\n').length === html.split('\n').length
				? '\r\n'
				: '\n';
			let markdown = preserveWhitespace(html, newline);
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
				const prevIndent = /^(\s+)/g.exec(node.content[0]) || [''];
				markdown = `${prevIndent[0]}${markdown}`;
			}
			const newContent = [];
			for (let newNode of parser(markdown)) {
				newContent.push(revertEntities(newNode));
			}
			node.content = newContent;
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
