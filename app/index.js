var express = require('express');
var socket = require('socket.io');
var http = require('http');
var eSession = require('express-session');
var sharedsession = require('express-socket.io-session');
var request = require('request');

var app = express();

var server = http.createServer(app);
var io = socket.listen(server);

var session = eSession({ secret: '*', resave: true, saveUninitialized: true });

app.use(session);
io.use(sharedsession(session, { autoSave: true }));

var nextIndex = 0;
io.on('connection', function(client) {
	if (client.handshake.session.index === undefined) {
		console.log('new client', nextIndex);
		client.handshake.session.index = nextIndex;
		client.handshake.session.save();
		nextIndex++;
	}
	client.send({
		endpoint: 'setIndex',
		index: client.handshake.session.index,
	});
	client.on('message', function(data) {
		console.log('message', data);
		client.broadcast.emit('message', data);
	});
});

app.get('/query', function(req, res) {
	var setId = req.query.id;
	var url =
		'https://quizlet.com/webapi/3.1/terms?filters[isDeleted]=0&filters[setId]=' +
		setId;
	request(
		{
			uri: url,
			// TODO dont use personal cs-token
			qs: { 'Cs-Token': 'gDyaUUgrcjXjbJ3e2X5QYc' },
			method: 'GET',
		},
		function(error, resp, body) {
			if (error || resp.statusCode !== 200) {
				console.log(url);
				console.error('error', error);
				console.error(JSON.stringify(JSON.parse(body), null, 2));
			} else {
				var response = JSON.parse(body).responses[0];
				var rawTerms = response.models.term;
				var terms = rawTerms
					.map(function(term) {
						return {
							word: term.word,
							definition: term.definition,
							index: term.rank,
						};
					})
					.sort(function(t1, t2) {
						return t1.index - t2.index;
					});
				res.send(terms);
			}
		}
	);
});

app.use(express.static('public'));

app.use(function(err, req, res, next) {
	console.error('index err', err.stack);
});

app.use(function(req, res, next) {
	res.sendStatus(404);
});

var port = process.env.PORT || 3000;

server.listen(port, function() {
	console.log('listening on port ' + port);
});
