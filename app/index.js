var express = require('express');
var socket = require('socket.io');
var http = require('http');
var eSession = require('express-session');
var sharedsession = require('express-socket.io-session');

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
