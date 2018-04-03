var express = require('express');

var app = express();

app.use(express.static('public'));

app.use(function(err, req, res, next) {
	console.error('index err', err.stack);
});

app.use(function(req, res, next) {
	res.sendStatus(404);
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log('listening on port ' + port);
});
