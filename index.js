var hanson = require('hanson');
var stream = require('stream');
var stripAnsi = require('strip-ansi');
var stringifyObject = require('stringify-object');
var util = require('util');

/**
* Extract the first, last or offsetted JSON stream from a text stream
* @param {string|array <string>|Buffer|Stream} data The data to process
* @param {Object} [options] Additional options
* @param {string} [options.want="object"] How to extract the JSON, can be "object", "string" (valid JSON), "js" (JavaScript object encoding)
* @param {boolean} [options.all=false] Return all found blocks (possibly restricted by `options.limit`) instead of the one matching the criteria in `options.offset`
* @param {string|number} [options.offset="first"] Either the numeric offset of the JSON blob to extract or 'first', 'last', 'largest', 'smallest' (if "first" this implies `options.limit=1`)
* @param {number} [options.limit=0] Restrict search to only this number of found blocks, if falsy all are searched
* @param {string} [options.prettyPrint=true] Whether to format the output JS when `want="js|string"`
* @param {string} [options.indent="\t"] The indenting method to use when `want="js|string"`
* @param {boolean} [options.stripAnsi=true] Try to remove all ANSI escape codes before decoding
* @param {boolean} [options.hanson=true] Run the input JSON though Hanson first to strip out comments and support JS object syntax
* @returns {Promise} Promise which resolves with the extracted JSON
*/
module.exports = function(data, options) {
	var settings = {...module.exports.defaults, ...options};

	return Promise.resolve({})
		// Options processing {{{
		.then(session => {
			if (settings.all) {
				settings.offset = 'all';
				settings.limit = 0;
			} else if (settings.offset == 'first') {
				settings.limit = 1;
			}
			return session;
		})
		// }}}
		// Slurp data {{{
		.then(session => new Promise((resolve, reject) => {
			if (typeof data == 'object' && Object.prototype.toString.call(data) == '[object Array]') {
				resolve({...session, data: data.join('\n')});
			} else if (typeof data == 'string') {
				resolve({...session, data});
			} else if (data instanceof Buffer) {
				resolve({...session, data: data.toString()});
			} else if (data instanceof stream.Readable) {
				var buf = '';
				data.on('data', res => buf += res.toString())
				data.on('close', ()=> resolve({...session, data: buf}));
			}
		}))
		// }}}
		// Find the blobs of JSON {{{
		.then(session => {
			var braceFinder = /([\{\}])/g;
			var startBlock;
			var braceCount = 0;

			session.result = [];
			while ((found = braceFinder.exec(session.data)) !== null) {
				if (found[1] == '{') { // Opening brace
					if (braceCount++ == 0) startBlock = found.index;
				} else { // Closing brace
					if (--braceCount <= 0) {
						session.result.push(session.data.substr(startBlock, found.index - startBlock + 1));
						if (settings.limit && found.length > settings.limit) break;
					}
				}
			}

			return session;
		})
		// }}}
		// Strip ANSI sequences {{{
		.then(session => {
			if (settings.stripAnsi) session.result = session.result.map(r => stripAnsi(r));
			return session;
		})
		// }}}
		// Format results into required format + return {{{
		.then(session => {
			// (offset) Narrow down results {{{
			if (settings.offset == 'last') {
				session.result = session.result.slice(-1);
			} else if (settings.offset == 'largest' || settings.offset == 'smallest') {
				session.result = session.result
					.sort((a, b) =>
						(a.length > b.length) ? settings.offset == 'largest' ? -1 : 1
						: (a.length < b.length) ? settings.offset == 'largest' ? 1 : -1
						: 0
					)
					.slice(0, 1)
			} else if (isFinite(settings.offset)) {
				session.result = session.result.slice(settings.offset, settings.offset + 1);
			}
			// }}}

			// (want) Convert into required format {{{
			if (
				settings.want == 'object'
				|| settings.want == 'js' // if want="js" we need it as an object first
				|| (settings.want == 'string' && settings.prettyPrint) // Same with string but only if we need to pretty print
			) {
				session.result = session.result.map(i => {
					try {
						return settings.hanson ? hanson.parse(i) : JSON.parse(i);
					} catch (e) {
						return {error: e, raw: i};
					}
				});
			}

			if (settings.want == 'string' && settings.prettyPrint) {
				session.result = session.result.map(r =>
					settings.prettyPrint
						?  JSON.stringify(r, null, settings.indent)
						: JSON.stringify(r)
				);
			} else if (settings.want == 'js') {
				session.result = session.result.map(r => stringifyObject(r, {
					indent: settings.indent,
					singleQuotes: false,
				}));
			}
			// }}}

			return session;
		})
		.then(session => settings.all ? session.result : session.result[0])
		// }}}
};

module.exports.defaults = {
	all: false,
	want: 'object',
	offset: 'first',
	limit: 0,
	prettyPrint: true,
	indent: '\t',
	hanson: true,
	stripAnsi: true,
};
