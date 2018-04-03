// (function() {
function main() {
	$('#name_input_submit').click(register);
	$('#start_submit').click(sendStart);
	register(); // dev
}

var socket;

function send(data) {
	receive(data);
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
	$('#start').show();
}

function sendStart() {
	$.get('num', function(numPlayers) {
		send({ endpoint: 'start', num: numPlayers });
	});
}

function start(data) {
	$('#start').hide();
	$('#game').show();
}

var endpoints = {
	setIndex: setIndex,
	start: start,
};

$(document).ready(main);
// })();
