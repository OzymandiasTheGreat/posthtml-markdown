import parser from 'posthtml-parser';
import render from 'posthtml-render';
import matcher from 'posthtml-match-helper';
import marked from 'marked';
import unescape from 'lean-he/decode';

function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }


function index (ref) {
	var whitespace = ref.whitespace; if ( whitespace === void 0 ) whitespace = '\t';
	var rest = objectWithoutProperties( ref, ["whitespace"] );
	var options = rest;

	return (function (tree) {
	var replaced = ['markdown', 'md', 'pre'];
	var stripped = ['a', 'abbr', 'address', 'b','bdo', 'bdi', 'button', 'cite', 'data', 'details', 'dfn', 'em', 'fieldset', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'kbd', 'label', 'mark', 'p', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time'];
	var indentation = typeof whitespace === 'string'
		? whitespace || '\t'
		: '\t';

	var preserveWhitespace = function (string, newline) {
		// If line consists of whitespace only, consider it empty
		var empty = function (line) { return /^\s*$/.test(line); };
		// Calculate indentation level
		var indent = function (line) {
			var space = /^\r?\n?([ \t]*)/.exec(line);
			if (space && space.length) { return space[0].split(indentation).length - 1; }
			return 0;
		};
		// Whitespace following final line break is the indentation for
		// the closing tag, so preserve it
		var trail = function (body) {
			var space = /(\r?\n?[ \t]+)$/gm.exec(body);
			if (space && space.length) { return space.pop(); }
			return '';
		};
		// Line numbering changes after conversion to markdown, so try to
		// generate a unique identifier for the line based on (content - markup)
		var tokenize = function (line) {
			var token = line.replace(/(<.+?>)|(#|\*|_|-|>|!)|(\(.+?\))|(\[|\])|\s/g, '');
			if (token) { return token; }
			else if (!empty(line)) { return line; }
			return '';
		};
		var prepend = {};
		var trimmed = [];
		for (var i = 0, list = string.split(newline); i < list.length; i += 1) {
			var line = list[i];

			prepend[tokenize(line)] = indent(line);
			trimmed.push(line.trim());
		}

		var processed = marked(trimmed.join(newline), options);
		var restored = [];
		var pre = false;
		var currIndent = 0;
		for (var i$1 = 0, list$1 = processed.split(newline); i$1 < list$1.length; i$1 += 1) {
			var line$1 = list$1[i$1];

			if (!empty(line$1)) {
				if (line$1.includes('<pre>')) { pre = true; }
				if (Object.keys(prepend).includes(tokenize(line$1))) {
					currIndent = prepend[tokenize(line$1)] || currIndent;
				}
				if (pre) { restored.push(line$1); }
				else { restored.push(("" + (indentation.repeat(currIndent)) + line$1)); }
				if (line$1.includes('</pre>')) { pre = false; }
			}
		}
		return restored[0].startsWith(indentation)
			? ("\n" + (restored.join(newline)) + (trail(string)))
			: ("" + (restored.join(newline)) + (trail(string)));
	};

	var revertEntities = function (node) {
		if (node.content) {
			for (var i = 0; i < node.content.length; i++) {
				var line = node.content[i];
				if (typeof line === 'string') { node.content[i] = unescape(line); }
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

	return new Promise(function (resolve) {
		tree.match(matcher('md, markdown, [md], [markdown]'), function (node) {
			// Fix for blockquotes and raw html
			var html = unescape(render(node.content));
			var newline = html.includes('\r') && html.split('\r\n').length === html.split('\n').length
				? '\r\n'
				: '\n';
			var markdown = preserveWhitespace(html, newline);
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
				var prevIndent = /^(\s+)/g.exec(node.content[0]) || [''];
				markdown = "" + (prevIndent[0]) + markdown;
			}
			var newContent = [];
			for (var i = 0, list = parser(markdown); i < list.length; i += 1) {
				var newNode = list[i];

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
}

export default index;
