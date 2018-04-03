var express = require('express');
var socket = require('socket.io');
var http = require('http');

var app = express();

var server = http.createServer(app);
var io = socket.listen(server);

var clientIndex = 0;
io.on('connection', function(client) {
	console.log('connection', client.id);
	client.send({ endpoint: 'setIndex', index: clientIndex });
	clientIndex++;
	client.on('message', function(data) {
		console.log('message', data);
		client.broadcast.emit('message', data);
	});
});

app.use(express.static('public'));

app.use('/num', function(req, res) {
	res.send(clientIndex.toString());
});

app.use('/reset', function(req, res) {
	clientIndex = 0;
	res.sendStatus(200);
});

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
