// (function() {
var startingHandSize = 5;
var startingBoardSize = 3;

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

var myIndex;
var players = [];
var terms;
var orderedTerms;
var currentPlayer = 0;
var board = [];

function setIndex(data) {
	myIndex = data.index;
	var name = $('#name_input').val();
	send({ endpoint: 'join', index: myIndex, name: name });
	$('#welcome').hide();
	$('#start').show();
	$(myIndex === 0 ? '#start_host' : '#start_wait').show();
}

function join(data) {
	players[data.index] = { name: data.name, hand: [] };
}

function sendStart() {
	var setId = $('#set_id_input').val();
	$.get('/query?id=' + setId, function(response) {
		orderedTerms = response.terms;
		deal();
		send({
			endpoint: 'start',
			title: response.title,
			setId: response.id,
			players: players,
			orderedTerms: orderedTerms,
			board: board,
		});
	});
	return false;
}

function deal() {
	terms = orderedTerms
		.map(function(term) {
			return term.index;
		})
		.sort(function() {
			return Math.random() - 0.5;
		});
	for (var i = 0; i < startingHandSize; i++) {
		players.forEach(function(player) {
			player.hand.push(terms.shift());
		});
	}

	for (var i = 0; i < startingBoardSize; i++) {
		board.push(terms.shift());
	}
	sortBoard();
}

function sortBoard() {
	board.sort(function(a, b) {
		return a - b;
	});
}

function start(data) {
	$('#set_title').text(data.title);
	$('#set_id').text(data.setId);
	players = data.players;
	board = data.board;
	orderedTerms = data.orderedTerms;

	render();

	$('#start').hide();
	$('#game').show();
}

function render() {
	$('#current_player').text(players[currentPlayer].name);
	$('#players').empty();
	players.forEach(function(player) {
		$('<div>')
			.addClass('bubble')
			.addClass('inline')
			.append($('<p>').text('Name: ' + player.name))
			.append($('<p>').text('Cards in Hand: ' + player.hand.length))
			.appendTo('#players');
	});
	$('#hand').empty();
	players[myIndex].hand.forEach(function(index) {
		$('<div>')
			.addClass('center-parent')
			.addClass('bubble')
			.addClass('card')
			.append($('<p>').text(orderedTerms[index].word))
			.append($('<br>'))
			.append($('<img>').attr('src', orderedTerms[index].image))
			.addClass('hand_card')
			.click(pick)
			.appendTo('#hand');
	});
	$('#board').empty();
	board.forEach(function(index, position) {
		makeBoardButton();
		$('<div>')
			.addClass('center-parent')
			.addClass('bubble')
			.addClass('card')
			.append($('<p>').text(orderedTerms[index].word))
			.append($('<p>').text(orderedTerms[index].definition))
			.append($('<img>').attr('src', orderedTerms[index].image))
			.appendTo('#board');
	});
	makeBoardButton();
}

function makeBoardButton() {
	$('<button>')
		.addClass('bubble')
		.addClass('card')
		.addClass('board-button')
		.click(play)
		.appendTo('#board');
}

function pick() {
	if (myIndex !== currentPlayer) {
		alert('Not your turn!');
		return;
	}
	$('.hand_card').removeClass('selected');
	$(this).addClass('selected');
}

function play() {
	var selectedIndex = $('.hand_card.selected').index();
	if (selectedIndex === -1) {
		alert('select a card from your hand first');
		return;
	}
	var pickIndex = players[myIndex].hand.splice(selectedIndex, 1)[0];
	var position = $(this).index() / 2;
	var correct = isCorrect(pickIndex, position);
	board.splice(position, 0, pickIndex);
	if (correct) {
		showImg('#correct_answer');
	} else {
		showImg('#wrong_answer');
		if (terms.length === 0) {
			send({ endpoint: 'alert', alert: 'Uh oh, we ran out of cards!' });
			return;
		}
		players[myIndex].hand.push(terms.shift());
		sortBoard();
	}
	var endpoint;
	if (correct && players[myIndex].hand.length === 0) {
		endpoint = 'victory';
	} else {
		endpoint = 'nextTurn';
	}
	send({ endpoint: endpoint, players: players, board: board });
}

function isCorrect(pickIndex, position) {
	if (position !== 0) {
		if (pickIndex < board[position - 1]) {
			return false;
		}
	}
	if (position !== board.length) {
		if (pickIndex > board[position + 1]) {
			return false;
		}
	}
	return true;
}

function showImg(selector) {
	$(selector).animate(
		{ 'margin-right': '-100%' },
		{
			duration: 1200,
			easing: 'linear',
			done: function() {
				$(selector).css('margin-right', '100%');
			},
		}
	);
}

function victory(data) {
	players = data.players;
	board = data.board;
	render();
	$('#game').hide();
	$('#game_end').show();
	$('#winner').text(players[currentPlayer].name);
}

function nextTurn(data) {
	players = data.players;
	board = data.board;
	currentPlayer = (currentPlayer + 1) % players.length;
	render();
}

function alertF(data) {
	alert(data.alert);
}

var endpoints = {
	setIndex: setIndex,
	join: join,
	start: start,
	nextTurn: nextTurn,
	victory: victory,
	alert: alertF,
};

$(document).ready(main);
// })();
