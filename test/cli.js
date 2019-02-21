var exec = require('child_process').exec;
var expect = require('chai').expect;

describe('CLI tests', ()=> {

	var cwd = `${__dirname}/..`;

	it('should process simple stdin > stdout', done => {
		exec(`echo 'abc{"foo": "Foo!"}def' | app.js --no-pretty`, {cwd}, (err, res) => {
			expect(err).to.be.not.ok;
			expect(res).to.be.equal('{"foo": "Foo!"}');
			done();
		});
	});

	it('should process simple files (smallest chunk)', done => {
		exec(`app.js --no-pretty --smallest ${__dirname}/data/simple.txt`, {cwd}, (err, res) => {
			expect(err).to.be.not.ok;
			expect(res).to.be.equal('{"f": "F!"}');
			done();
		});
	});

	it('should process simple files (largest chunk)', done => {
		exec(`app.js --no-pretty --largest ${__dirname}/data/simple.txt`, {cwd}, (err, res) => {
			expect(err).to.be.not.ok;
			expect(res).to.be.equal('{"bar": [{"baz": "Baz!"}, 2, 3]}');
			done();
		});
	});


});
