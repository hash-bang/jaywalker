Jaywalker
=========
Extract JSON from a stream of junk text.

This module can be used to find, decode and convert JSON within strings of junk text. Think of it as Grep designed specifically for finding JSON blobs.

**Purpose:**

* Be as tolerant as possible of mangled JavaScript - this module / CLI can understand basic JSON, JS notation or annotated JSON via the [Hanson](https://github.com/timjansen/hanson) parser
* Provide easy ways of selecting which blob (or all) of JSON to output



Why
---
I found that sometimes dropping a `console.log(someComplexObject)` is sometimes the easiest way to debug but what if that object is *really* big and hard to read?
With Jaywalker you can pipe the output of your program and have it extract that JSON, then pass that onto something else.
For example the following runs a Node server which does a lot of stuff but only extracts the largest JSON blob before piping that to the next process:

```
node server.js | jaywalker --largest | fx
```


API
===
As well as shipping with a command-line-interface (CLI) this module also supports a modular API.


jaywalker(data, [options])
--------------------------
The main worker function. This will always return a Promise which should resolve with the desired output (depending on `options.want`).

Supported options are:

| Option        | Type      | Default    | Description                                                                                                                                                                                          |
| `want`        | `string`  | `"object"` | The desired output of the module when everything gets decoded. Options are `"object"` (the converted JS object), `"string"` (a valid JSON object), `"js"` (a JavaScript object notation as a string) |
| `all`         | `boolean` | `false`    | Whether all found results should be returned or only the first one matching `offset`                                                                                                                 |
| `offset`      | `string`  | `"first"`  | The desired output of the function. Options are `"first"`, `"last"`, `"smallest"`, `"largest"` or a zero-based-index number                                                                          |
| `limit`       | `number`  | `0`        | The number of JSON blobs to process before applying the `all` / `offset` criteria to select the result                                                                                               |
| `prettyPrint` | `boolean` | `true`     | Whether the result should be pretty printed. Only applies if `want="string"` or `want="js"`                                                                                                          |
| `indent`      | `string`  | `"\t"`     | The indenting used when pretty printing                                                                                                                                                              |
| `stripAnsi`   | `boolean` | `true`     | Attempt to strip ANSI escape codes before processing the input                                                                                                                                       |
| `hanson`      | `boolean` | `true`     | Use the [Hanson](https://github.com/timjansen/hanson) parser rather than the default JSON one for more tolerant JSON formats                                                                        |


jaywalker.defaults
------------------
An object containing all the global default settings for the module.
