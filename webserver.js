const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const trueYouUserRoutes = require('./back_end_server/src/routes/trueYouUser.routes')
const streamRoutes = require('./back_end_server/src/routes/stream.routes')
const crypto = require('crypto');
const keysOfServer = require('./back_end_server/src/config/key');
const chatRoutes = require('./back_end_server/src/routes/chat.routes')
var path = require('path')
const errorModel = require('./back_end_server/src/models/error.model')
var app = express()
const config = require('./webserver.config')
var server = require('http').createServer(app);
var io = require('socket.io')(server);

global.io = io
app.use(morgan('dev'))
// app.use(bodyParser.json())
app.use(bodyParser.json({ limit: '1mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }))

const port = process.env.PORT || 3000
app.use(express.static(path.join(__dirname, 'public')));
var Bits, StreamServer, strconfig, logger, streamServer, url, request;

url = require('url');
strconfig = require('./stream_library/config');
StreamServer = require('./stream_library/service/stream_server');
Bits = require('./stream_library/service/bits');
logger = require('./stream_library/service/logger');
loggert = require('./back_end_server/src/config/winston')
request = require('request')
Bits.set_warning_fatal(true);
logger.setLevel(logger.LEVEL_INFO);
streamServer = new StreamServer;

//  callback null, isAuthenticated
streamServer.setLivePathConsumer(function (uri, callback) {
	var pathname, ref
	pathname = (ref = url.parse(uri).pathname) != null ? ref.slice(1) : void 0
	isAuthorized = true
	if (isAuthorized) {
		return callback(null) // Accept access
	} else {
		return callback(new Error('Unauthorized access')) // Deny access
	}
})

if (strconfig.recordedDir != null) {
	streamServer.attachRecordedDir(strconfig.recordedDir);
}




process.on('SIGINT', () => {
	loggert.info('Server shutdown')
	return streamServer.stop(function () {
		return process.kill(process.pid, 'SIGTERM')
	})
})

process.on('uncaughtException', function (err) {
	streamServer.stop()
	throw err
})

app.all('/*', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', '*')
	next()
})

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/front_end_server/views/login.html'))
})

// app.use(express.bodyParser());
app.use(function (req, res, next) {
	var buffer = ""
	next();

});

// Normal routing
app.use('/api', trueYouUserRoutes)
app.use('/stream', streamRoutes)
app.use('/chat', chatRoutes)

app.use('*', (req, res, next) => {
	next(new errorModel('Non-existing endpoint', 404))
})

// handler for errors
app.use('*', (err, req, res, next) => {
	console.dir(err)
	// return response to caller
	res.status(err.code).json({ error: err }).end()
})


streamServer.start()

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))
var server = server.listen(config.webServerPort, () => {

	console.log('server is running on port', server.address().port);
});
var map = new Map();
// handle incoming connections from clients
io.sockets.on('connection', function (socket) {
	// once a client has connected, we expect to get a ping from them saying what room they want to join			
	socket.on('create', function (room) {
		socket.join(room)
	})
	socket.on('join', function (room) {
		loggert.info('The amount of viewers on ' + room + ' was incremented by 1 on ' + new Date());
		if (map.get(room) == undefined) {
			map.set(room, 0)
		}
		if(isNaN(parseFloat(map.get(room)))){
			map.set(room, 0)
		}

		var currentCount = map.get(room);
		currentCount = currentCount + 1;
		map.set(room, currentCount)
		var clientCount = map.get(room)
		const sign = crypto.createSign('SHA256');
		sign.write(String(clientCount));
		sign.end();
		const signature = sign.sign(keysOfServer.privateKeyServer, 'base64');
		var obj = {}
		obj['count'] = String(clientCount);
		obj['digisig'] = signature;
		io.emit("viewCount" + room, obj)
	})

	socket.on('disconnect', function (room) {
		socket.leave(room)
	});
	socket.on('leave', function (room) {
		loggert.info('The amount of viewers on ' + room + 'was decremented by 1 on ' + new Date());
		if (map.get(room) == undefined) {
			map.set(room, 0)
		}
		if(isNaN(parseFloat(map.get(room)))){
			map.set(room, 0)
		}

		var currentCount = map.get(room);
		currentCount = currentCount - 1;
		map.set(room, currentCount)
		var clientCount = map.get(room)
		const sign = crypto.createSign('SHA256');
		sign.write(String(clientCount));
		sign.end();
		const signature = sign.sign(keysOfServer.privateKeyServer, 'base64');
		var obj = {}
		obj['count'] = String(clientCount);
		obj['digisig'] = signature;
		io.emit("viewCount" + room, obj)
	})
})

loggert.info('All modules on server have been booted and loaded')
// for testing purpose
module.exports = app
