// (function() {
function main() {
	$('#name_input_submit').submit(register);
	$('#start_submit').submit(start);
	register(); // dev
}

var socket;

function send(data) {
	socket.send(data);
}

function receive(data) {
	var endpoint = endpoints[data.endpoint];
	if (endpoint) {
		console.log(data.endpoint);
		endpoint(data);
	} else {
		console.log('receive', data);
	}
}

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

var myIndex;
function setIndex(data) {
	myIndex = data.index;
	$('#welcome').hide();
	$('#start_div').show();
}

function start() {
	send({ endpoint: 'start' });
}

var endpoints = {
	setIndex: setIndex,
};

$(document).ready(main);
// })();
