var express = require('express');
var wagner = require('wagner-core');
var path = require('path')

require('./../model/models')(wagner);

var app = express();

app.use('/api/v1', require('./api')(wagner));

app.use(express.static('./../views'));
app.use('/extern', express.static('./../extern'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/../views/navigateKanji.html'));
});

app.listen(3000);
console.log('Listening on port 3000!');
