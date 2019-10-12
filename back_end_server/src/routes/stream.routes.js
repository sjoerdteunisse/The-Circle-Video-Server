const router = require('express').Router()
var path = require("path");
var streamers = require('../../../stream_library/service/streamers')
const playerJs = path.join(__dirname, '../public/player.js')
const playerMinJs = path.join(__dirname, '../public/player.min.js')
const playerCss = path.join(__dirname, '../public/player.css')
// Get stream overview
router.get('/streamoverview', function(req, res) {
    res.status(200).sendFile(path.join(__dirname + '../../../../front_end_server/views/streamoverview.html'));
});

// Get main page
router.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname + '../../../../front_end_server/views/main.html'));
});

// Get streamers
router.get('/getStreams', function(req, res) {
    res.send(streamers.getStreamers());
})

// Get streampage (1)
router.get('/1', function(req, res) {
    res.sendFile(path.resolve(__dirname + '../../../../front_end_server/views/onestream.html'));
});

// Get streampage (4)
router.get('/4', function(req, res) {
    res.sendFile(path.resolve(__dirname + '../../../../front_end_server/views/multiplestreams.html'));
});

router.get('/public/player.js', (req, res) => {
	res.sendFile(playerJs)
})

router.get('/public/player.min.js', (req, res) => {
	res.sendFile(playerMinJs)
})

router.get('/public/player.css', (req, res) => {
	res.sendFile(playerCss)
})

router.param('id', (req, res, next, id) => {
	const streams = streamers.getStreamersEncoding();
	const stream = streams[id]
	if (!stream) {
	  return res.status(404)
	    .end(`stream "${id}" not found`)
	}
	if (!stream.hasOwnProperty('ffmpeg')) {
	  return res.status(500)
	    .end(`stream "${id}" does not have a valid ffmpeg src`)
	}
	res.locals.id = stream.phone
	res.locals.stream = stream
	next()
})
    
router.param('type', (req, res, next, type) => {
	const stream = res.locals.stream
	switch (type) {
	  case 'mp4' :
	    if (!stream['ffmpeg'].running) {
	      return res.status(503)
		.end(`stream "${res.locals.id}" is currently not running`)
	    }
	    if (stream.hasOwnProperty('mp4frag')) {
	      res.locals.mp4frag = stream['mp4frag']
	      return next()
	    }
	    return res.status(404)
	      .end(`mp4 type not found for stream ${res.locals.id}`)
	  case 'jpeg' :
	    if (!stream['ffmpeg'].running) {
	      return res.status(503)
		.end(`stream "${res.locals.id}" is currently not running`)
	    }
	    if (stream.hasOwnProperty('pipe2jpeg')) {
	      res.locals.pipe2jpeg = stream['pipe2jpeg']
	      return next()
	    }
	    return res.status(404)
	      .end(`jpeg type not found for stream ${res.locals.id}`)
	  case 'cmd' :
	    if (stream.hasOwnProperty('ffmpeg')) {
	      res.locals.ffmpeg = stream['ffmpeg']
	      return next()
	    }
	    return res.status(404)
	      .end(`cmd type not found for stream ${res.locals.id}`)
	  case 'debug' :
	    return res.end(inspect(res.locals.stream, { sorted: true, showHidden: false, compact: false, depth: 2, colors: false, breakLength: 200, getters: true}))
	  default :
	    res.status(404)
	      .end(`${type} type not found for stream ${res.locals.id}`)
	}
})
    
router.get('/api/:id/:type/*', (req, res, next) => {
	// trigger the app.param functions
	next()
})
    
router.get('/api/*/jpeg/image.jpeg', (req, res) => {
	const pipe2jpeg = res.locals.pipe2jpeg
	const jpeg = pipe2jpeg.jpeg
	if (!jpeg) {
	  return res.status(503)
	    .set('Retry-After', 10)
	    .end(`Stream "${res.locals.id}" image.jpeg currently unavailable. Please try again later.`)
	}
	res.status(200)
	  .set('Content-Type', 'image/jpeg')
	  .end(jpeg)
})

module.exports = router