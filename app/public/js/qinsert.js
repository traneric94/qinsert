// (function() {
function main() {
	$('#name_input_submit').submit(register);
	register();
}

var myName;
var socket;
function register() {
	if (myName !== undefined) {
		console.log('already registered!');
		return;
	}
	socket = io(location.href);
	socket.on('connect', function() {
		console.log('connected');
	});
	socket.on('message', receive);
}

function send(data) {
	socket.send(data);
}

function receive(data) {
	console.log('receive', data);
}

$(document).ready(main);
// })();
