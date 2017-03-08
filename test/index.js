var tap = require('agraddy.test.tap')(__filename);
var fs = require('fs');
var path = require('path');

var mod = require('../');

var actual;
var expected;

process.chdir('test');

// Gmail
actual = mod(getEmail('gmail.eml'));
expected = getJSON('gmail.json');
tap.assert.deepEqual(actual, expected, 'Should be equal.');

// Gmail With Attachment
actual = mod(getEmail('gmail_attachment.eml'));
expected = getJSON('gmail_attachment.json');
tap.assert.deepEqual(actual, expected, 'Should be equal.');

// Failure 1 (based off an actual email that failed)
actual = mod(getEmail('failure1.eml'));
expected = getJSON('failure1.json');
//console.log('actual');
//console.log(actual);
//console.log('expected');
//console.log(expected);
tap.assert.deepEqual(actual, expected, 'Should be equal.');





// Need to setup a test where multiple colons appear in a header (like the subject)


function getEmail(input) {
	return fs.readFileSync(path.join('fixtures', input)).toString();
}

function getJSON(input) {
	return require('./fixtures/' + input);
}

