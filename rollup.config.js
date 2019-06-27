import buble from 'rollup-plugin-buble';


import pkg from './package.json';


module.exports = {
	external: ['lean-he/decode', ...Object.keys(pkg.dependencies)],
	input: 'src/index.js',
	output: [
		{
			file: 'dist/index.js',
			format: 'cjs',
		},
		{
			file: 'dist/index.es.js',
			format: 'esm',
		},
	],
	plugins: [buble({transforms: { dangerousForOf: true }})],
};
