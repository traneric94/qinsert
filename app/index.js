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

var apiUrl = 'https://quizlet.com/webapi/3.1/';
var termsUrl = apiUrl + 'terms?filters[isDeleted]=0&filters[setId]=';
var setUrl = apiUrl + 'sets/';
var searchUrl = setUrl + 'search?filters[isDeleted]=0&perPage=9&query=';
// TODO dont use personal cs-token
var qs = { 'Cs-Token': 'gDyaUUgrcjXjbJ3e2X5QYc' };
app.get('/query', function(req, res) {
	var setId = req.query.id;
	if (!(Number(setId) > 0)) {
		var query = setId;
		get(searchUrl + query, function(response) {
			setId = response.models.set[0].id;
			getSet(setId, res);
		});
	} else {
		getSet(setId, res);
	}
});

function get(url, callback) {
	request({ uri: url, qs: qs, method: 'GET' }, function(error, resp, body) {
		if (error || resp.statusCode !== 200) {
			console.log(query);
			console.error('error', error);
			console.error(JSON.stringify(JSON.parse(body), null, 2));
		} else {
			var response = JSON.parse(body).responses[0];
			callback(response);
		}
	});
}

function getSet(setId, res) {
	var title;
	var terms;
	get(termsUrl + setId, function(response) {
		var rawTerms = response.models.term;
		terms = rawTerms
			.map(function(term) {
				return {
					word: term.word,
					definition: term.definition,
					index: term.rank,
					image: term._imageUrl,
				};
			})
			.sort(function(t1, t2) {
				return t1.index - t2.index;
			});
		if (title !== undefined) {
			res.send({ title: title, terms: terms });
		}
	});
	get(setUrl + setId, function(response) {
		title = response.models.set[0].title;
		if (terms !== undefined) {
			res.send({ title: title, terms: terms });
		}
	});
}

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
