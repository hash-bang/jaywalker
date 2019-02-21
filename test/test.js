var chai = require('chai');
var expect = chai.expect;
var jaywalker = require('..');
chai.use(require("chai-as-promised"));

describe('simple tests', ()=> {

	it('should find JSON within some junk filled strings', ()=> {
		expect(jaywalker('{"foo": "Foo!"}')).to.eventually.deep.equal({foo: 'Foo!'});
		expect(jaywalker('abcde{"bar": "Bar!"}fghijk')).to.eventually.deep.equal({bar: 'Bar!'});
		expect(jaywalker('abcde{"baz": "Baz!"}fghijk{"quz": 123}lmnopq', {all: true})).to.eventually.deep.equal([{baz: 'Baz!'}, {quz: 123}]);
	});

	it('should respect all / limit / offset rules', ()=> {
		var junkStr = 'ab{"f": "F!"}cde{"bar": [{"baz": "Baz!"}, 2, 3]}fghijk{"quz": 123}lmnopq';
		var junkResult = [{f: "F!"}, {bar: [{baz: "Baz!"}, 2, 3]}, {quz: 123}];

		expect(jaywalker(junkStr, {all: true})).to.eventually.deep.equal(junkResult);
		expect(jaywalker(junkStr)).to.eventually.deep.equal({f: "F!"});
		expect(jaywalker(junkStr, {offset: 'first'})).to.eventually.deep.equal({f: "F!"});
		expect(jaywalker(junkStr, {offset: 0})).to.eventually.deep.equal({f: "F!"});
		expect(jaywalker(junkStr, {offset: 'last'})).to.eventually.deep.equal({quz: 123});
		expect(jaywalker(junkStr, {offset: 1})).to.eventually.deep.equal({bar: [{baz: "Baz!"}, 2, 3]});
		expect(jaywalker(junkStr, {offset: 'largest'})).to.eventually.deep.equal({bar: [{baz: "Baz!"}, 2, 3]});
		expect(jaywalker(junkStr, {offset: 'smallest'})).to.eventually.deep.equal({f: "F!"});
		expect(jaywalker(junkStr, {limit: 1})).to.eventually.deep.equal({f: "F!"});
		expect(jaywalker(junkStr, {limit: 2})).to.eventually.deep.equal({f: "F!"}, {bar: [{baz: "Baz!"}, 2, 3]});
	});

	it('should support Hanson + JS Object notation as input', ()=> {
		expect(jaywalker('abc{foo: "Foo!"}def', {want: 'string'})).to.eventually.deep.equal(`{\n\t"foo": "Foo!"\n}`);
		expect(jaywalker('abc{foo: "Foo!", /* Comment */\nbar: 123}def', {want: 'js'})).to.eventually.deep.equal(`{\n\tfoo: "Foo!",\n\tbar: 123\n}`);
	});

	it('should be able to output as strings', ()=> {
		var junkStr = 'ab{"f": "F!"}cde{"bar": [{"baz": "Baz!"}, 2, 3]}fghijk{"quz": 123}lmnopq';
		expect(jaywalker(junkStr, {offset: 'smallest', want: 'string'})).to.eventually.deep.equal(`{\n\t"f": "F!"\n}`);
		expect(jaywalker(junkStr, {offset: 'smallest', want: 'js'})).to.eventually.deep.equal(`{\n\tf: "F!"\n}`);
	});

});
