// (function() {
function main() {
	$('#name_input_submit').submit(register);
	register(); // dev
}

var myIndex;
var socket;
function register() {
	if (myIndex !== undefined) {
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
	var endpoint = endpoints[data.endpoint];
	if (endpoint) {
		endpoint(data);
	} else {
		console.log('receive', data);
	}
}

function setIndex(data) {
	myIndex = data.index;
}

var endpoints = {
	index: setIndex,
};

$(document).ready(main);
// })();
