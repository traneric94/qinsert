var express = require('express');
var socket = require('socket.io');
var http = require('http');

var app = express();

var server = http.createServer(app);
var io = socket.listen(server);

io.on('connection', function(client) {
	console.log('connection', client.id);
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
