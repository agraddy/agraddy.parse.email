// This code could be much cleaner but right now I'm just trying to get it to pass the tests.
var addressParser = require('addressparser');
var multipart = require('agraddy.parse.multipart');
var quotedPrintable = require('quoted-printable');

var mod = {};

mod = function(input) {
	var attachment = {};
	var email = {};
	var content = '';
	var i;
	var j;
	var output = {};
	var line;
	var lines = input.split(/\r?\n/g);
	var state = 'header';
	var substate = '';
	var boundary;
	var subboundary;
	var started = false;
	var ended = false;
	var finished = false;
	var type = '';
	var parsed = [];
	var subparsed = [];

	//console.log('lines');
	//console.log(lines);

	email.attachments = [];
	email.rawHeaders = [];
	email.headers = {};
	email.text = {};
	email.text.content = '';
	email.text.rawHeaders = [];
	email.text.headers = {};
	email.html = {};
	email.html.content = '';
	email.html.rawHeaders = [];
	email.html.headers = {};

	for(i = 0; i < lines.length; i++) {
		if(state == 'header' && lines[i] == '') {
			state = 'message';
		} else {
			line = lines[i];

			// Unfold headers: https://tools.ietf.org/html/rfc5322#section-2.2.3
			if(state == 'header') {
				// Check while lines wrapped
				while((i + 1) < lines.length && /^\s/.test(lines[i + 1])) {
					i++;
					line += lines[i].replace(/(^\s*)/, '');
				}
			}

			//console.log('LINE: ' + line);
			handleLine(line);
		}
	}

	if(boundary) {
		parsed = multipart(boundary, content);
		//console.log('parsed');
		//console.log(parsed[0]);

		if(type == 'alternative') {
			getContent(parsed);
		} else if(type == 'mixed') {
			for(i = 0; i < parsed.length; i++) {
				if(parsed[i].headers['content-type'] &&  parsed[i].headers['content-type'].indexOf('multipart/alternative') != -1) {
					subboundary = parsed[i].headers['content-type'].split('=')[1];
					// Strip double quotes
					if(/^"(.*)"$/.test(subboundary)) {
						subboundary = subboundary.replace(/^"(.*)"$/, '$1');
					}
					subparsed = multipart(subboundary, parsed[i].content);
					getContent(subparsed);
				} else if(parsed[i].headers['content-disposition'] &&  parsed[i].headers['content-disposition'].indexOf('attachment') != -1) {
					attachment = {};
					attachment.filename = parsed[i].headers['content-disposition'].match(/filename="(.*)"/)[1];
					attachment.data = parsed[i].content;
					email.attachments.push(attachment);
				} else {

				}
			}
		}
	}

	output.attachments = email.attachments;
	output.from = addressParser(email.headers['from'])[0].address;
	output.html = email.html.content;
	output.subject = email.headers['subject'];
	output.text = email.text.content;
	output.to = addressParser(email.headers['to'])[0].address;

	return output;

	function getContent(parsed) {
		var i = 0;
		for(i = 0; i < parsed.length; i++) {
			if(parsed[i].headers['content-type'] &&  parsed[i].headers['content-type'].indexOf('text/plain') != -1) {
				email.text.content = parsed[i].content;

			} else if(parsed[i].headers['content-type'] &&  parsed[i].headers['content-type'].indexOf('text/html') != -1) {
				email.html.content = parsed[i].content;

				if(parsed[i].headers['content-transfer-encoding'] &&  parsed[i].headers['content-transfer-encoding'] == 'quoted-printable') {
					email.html.content = quotedPrintable.decode(parsed[i].content);
				}
			}
		}
	}

	function handleHeader(input) {
		header = input.split(':');

		if(header.length > 1) {
			email.headers[header[0].trim().toLowerCase()] = header[1].trim();

			email.rawHeaders.push(header[0].trim());
			email.rawHeaders.push(header[1].trim());

			if(header[0].trim().toLowerCase() == 'content-type' && header[1].indexOf('multipart/alternative') != -1) {
				boundary = header[1].trim().split('=')[1];
				// Strip double quotes
				if(/^"(.*)"$/.test(boundary)) {
					boundary = boundary.replace(/^"(.*)"$/, '$1');
				}
				type = 'alternative';
			}
			if(header[0].trim().toLowerCase() == 'content-type' && header[1].indexOf('multipart/mixed') != -1) {
				boundary = header[1].trim().split('=')[1];
				// Strip double quotes
				if(/^"(.*)"$/.test(boundary)) {
					boundary = boundary.replace(/^"(.*)"$/, '$1');
				}
				type = 'mixed';
			}
		} else {
			email.rawHeaders.push(header[0].trim());
		}
	}

	function handleLine(input) {
		var header;
		if(state == 'header') {
			handleHeader(input);
		} else {
			if(boundary && email.headers['content-type'] && email.headers['content-type'].indexOf('multipart/alternative') != -1) {
				content += input + '\n';
			} else if(boundary && email.headers['content-type'] && email.headers['content-type'].indexOf('multipart/mixed') != -1) {
				content += input + '\n';
			} else {
			}
		}
	}
}

module.exports = mod;
