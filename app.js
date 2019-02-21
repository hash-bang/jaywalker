#!/usr/bin/env node

var fs = require('fs');
var jaywalker = require('.');
var program = require('commander');

program
	.version(require('./package.json').version)
	.usage('[file]')
	.option('-a, --all', 'Return all found JSON objects within an array')
	.option('-o, --offset <first|last|smallest|largest|number>', 'Specify the offset of the JSON blob to return, default is \'largest\'')
	.option('--first', 'Return the first found JSON blob')
	.option('--last', 'Return the last found JSON blob')
	.option('--largest', 'Return the largest found JSON blob')
	.option('--smallest', 'Return the smallest found JSON blob')
	.option('--limit <number>', 'Limit processing to only this number of JSON blobs')
	.option('--no-pretty', 'Disable pretty printing')
	.option('-v, --verbose', 'Be verbose')
	.parse(process.argv);

Promise.resolve()
	// Compute options {{{
	.then(()=> ({
		want: 'string',
		all: program.all,
		offset:
			program.offset ? program.offset
			: program.first ? 'first'
			: program.last ? 'last'
			: program.largest ? 'largest'
			: program.smallest ? 'smallest'
			: 'largest',
		limit: program.limit,
		prettyPrint: program.pretty,
	}))
	// }}}
	// Output options if (--verbose) {{{
	.then(options => {
		if (program.verbose) process.stderr.write(`Running with ${JSON.stringify(options)}\n`);
		return {options};
	})
	// }}}
	// Slurp input {{{
	.then(session => new Promise((resolve, reject) => {
		if (program.args.length) {
			fs.readFile(program.args[0], 'utf-8', (err, res) => {
				if (err) return reject(err);
				resolve({...session, data: res});
			})
		} else if (!process.stdin.isTTY) { // Slurp from STDIN
			resolve({...session, data: process.stdin});
		} else {
			reject('No input file or STDIN input');
		}
	}))
	// }}}
	// Run Jaywalker {{{
	.then(session => jaywalker(session.data, session.options).then(result => ({...session, result})))
	// }}}
	// Output result {{{
	.then(session => process.stdout.write(session.result))
	// }}}
	// End {{{
	.catch(e => {
		console.log(e.toString());
		process.exit(1);
	})
	// }}}
