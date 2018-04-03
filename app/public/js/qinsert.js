// (function() {
function main() {
	$('#name_input_form').submit(register);
	$('#start_host').submit(sendStart);
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
	socket = io();
	socket.on('connect', function() {
		console.log('connected');
	});
	socket.on('message', receive);
	return false;
}

var isHost;
var myIndex;
var players = [];
function setIndex(data) {
	myIndex = data.index;
	isHost = myIndex === 0;
	var name = $('#name_input').val();
	send({ endpoint: 'join', index: myIndex, name: name });
	$('#welcome').hide();
	$(isHost ? '#start_host' : '#start_wait').show();
}

function join(data) {
	players[data.index] = data.name;
}

function sendStart() {
	send({ endpoint: 'start', players: players });
	return false;
}

function start(data) {
	players = data.players;
	$('#start').hide();
	$('#game').show();
}

var endpoints = {
	setIndex: setIndex,
	join: join,
	start: start,
};

$(document).ready(main);
// })();
