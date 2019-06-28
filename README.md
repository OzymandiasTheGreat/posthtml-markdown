# PostHTML-Markdown

[posthtml-markdown](https://github.com/OzymandiasTheGreat/posthtml-markdown) is a markdown plugin for [posthtml](https://github.com/posthtml/posthtml) that let's you use [markdown](https://github.github.com/gfm/) inside html elements easily.

There's already [posthtml-md](https://github.com/jonathantneal/posthtml-md), but it has long standing bugs and the codebase is more complicated than necessary and prone to breakage.

This plugin:
- recognizes any tag with `md` or `markdown` attribute (attribute is removed)
- recognizes `md` and `markdown` tags (tag is removed)
- treats `pre` tags with `md` or `markdown` attribute as `markdown` tags
- does a decent job of NOT putting block-level elements inside inline elements (You still need to write valid markdown, like not putting `# Headings` in `p` tags)


## Example

```html
<h1 markdown>Heading with *italics*</h1>
Will produce
<h1>Heading with <em>italics</em>


<p markdown>
	**Bold** paragraph
</p>
Output
<p><strong>Bold</strong></p>

It also handles markdown in child elements
<body markdown>
	<div class="overflow">

		| Head | row |
		|------|-----|
		| Data | row |

	</div>
</body>

You do need extra empty lines around markdown in unmarked `div`s
This will look like
<body>
	<div class="overflow">
		<table>
		<thead>
		<tr>
		<th>Head</th>
		<th>row</th>
		</tr>
		</thead>
		<tbody>
		<tr>
		<th>Data</th>
		<th>row</th>
		</tr>
		</tbody>
	</div>
</body>
```


## Options

All options are passed to [marked](https://github.com/markedjs/marked) directly, except for:

- `whitespce (string; default: '\t')`: String to use for indentation. It should
consist of characters representing one level of indentation.


## Install

posthtml-markdown is available on npm:

`npm i -D posthtml-markdown`


## Usage

### PostHTML

```javascript
posthtml = require('posthtml');

posthtml([require('posthtml-markdown')({/* options */})])
	.process(html)
	.then((output) => {/*...*/});
```

### Rollup

```javascript
import posthtml from 'rollup-plugin-posthtml-multi';
import markdown from 'posthtml-markdown';

module.exports = {
	/*...*/
	plugins: [
		posthtml({
			plugins: [markdown({/* options */})],
		}),
	],
};
