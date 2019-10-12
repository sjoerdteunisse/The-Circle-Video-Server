const Mp4Frag = require('mp4frag')
const FR = require('ffmpeg-respawn')
var crypto = require('crypto')
const config = require('../../webserver.config.js')
const P2J = require('pipe2jpeg')
const iObject = require('../service/IntegrityObject.js');
const { path: ffmpegPath } = require('ffmpeg-static')
const key = require('../../back_end_server/src/config/key');
const streamers = require('../service/streamers')
const logger = require('../../back_end_server/src/config/winston');


module.exports = {
	getParameters(clientId) {
		let parameters = {
			"id": clientId.split('/')[1],
			"name": clientId,
			"logLevel": "quiet",
			"params":[
				"-hwaccel",
				"auto",
				"-probesize",
				"32",
				"-analyzeduration",
				"0",
				"-reorder_queue_size",
				"0",
				"-rtsp_transport",
				"tcp",
				"-i",
				//`rtsp://172.20.10.2:8080/${clientId}`,
				//`rtsp://145.49.56.232:8080/${clientId}`,
				"rtsp://" + config.rtspWebServerListnerIP + ":" + config.rtspWebServerListnerPort +"/"+ clientId,
				"-c:v",
				"copy",
				"-f",
				"mp4",
				"-movflags",
				"+dash+negative_cts_offsets",
				"-metadata",
				`title=\"stream on endpoint ${clientId}\"`,
				"pipe:1",
				"-c",
				"mjpeg",
				"-q",
				"10",
				"-r",
				"7",
				"-vf",
				"scale=trunc(iw*0.75/2)*2:-2",
				"-f",
				"image2pipe",
				"pipe:4"
			],
			"hlsBase": clientId.split('/')[1],
			"hlsListSize": 3
		}

		return parameters
	},
	sendStream(parameters, streamId, callback) {
		// io is global
		// let io = app.locals.io;

		// create new mp4 segmenter that will create mime, initialization, and segments from data piped from ffmpeg
		const mp4frag = new Mp4Frag({ hlsBase: parameters.hlsBase, hlsListSize: parameters.hlsListSize })

		// create new jpeg parser that will keep most recent jpeg in memory with timestamp for client requests
		const pipe2jpeg = new P2J()
	

		//ffmpeg object which is also able to restart itself
		const ffmpeg = new FR(
			{
				path: ffmpegPath,
				logLevel: parameters.logLevel,
				killAfterStall: 10,
				spawnAfterExit: 5,
				reSpawnLimit: 5,
				params: parameters.params,
				pipes:
					[
						{
							stdioIndex: 1, destination: mp4frag
						},
						{
							stdioIndex: 4, destination: pipe2jpeg
						}
					],
				exitCallback: (code, signal) => {
					console.error('exit', parameters.name, code, signal)
					if (mp4frag) {
						mp4frag.resetCache()
						callback(true, parameters.id, 'ffmpeg restarting for stream')
					}
				}
			})
			.start()
		
		streamers.setEncodingObjects(streamId, ffmpeg, mp4frag, pipe2jpeg)
	      
		// get namespace of stream
		const namespace = `/${parameters.id}`
	      
		// accessing "/namespace" of io based on id of stream
		io.of(namespace).on('connection', (socket) => {
			
			console.log('\x1b[36m%s\x1b[0m', `a follower connected to stream "${namespace}"`)
			logger.info('Stream controller: A follower connected to stream ' + namespace);

			// event listener
			const onInitialized = () => {
				socket.emit('mime', mp4frag.mime)
				mp4frag.removeListener('initialized', onInitialized)
				
			}
		
			// event listener
			const onSegment = (data) => {

				//create a hash over the video data

				let hash_over_data = crypto.createHash('sha256').update(data).digest("base64");
				const sign = crypto.createSign('SHA256');
				sign.write(Buffer.from(data).toString('base64'));
				sign.end();
				const signature = sign.sign(key.privateKeyServer, 'base64');

				socket.emit('segment', {
					hash: hash_over_data, 
					encryptedSignature: signature,
					buffer: data
				})
			}
		
			// client request
			const mimeReq = () => {
				if (mp4frag.mime) {
					socket.emit('mime', mp4frag.mime)
				} else {
					mp4frag.on('initialized', onInitialized)
				}
			}
		
			// client request
			const initializationReq = () => {
				socket.emit('initialization', mp4frag.initialization)
			}
		
			// client request
			const segmentsReq = () => {
				// send current segment first to start video asap
				if (mp4frag.segment) {
					socket.emit('segment', mp4frag.segment)
				}

				// add listener for segments being dispatched by mp4frag
				mp4frag.on('segment', onSegment)
			}
		
			// client request
			const segmentReq = () => {
				console.log('SegmentRequestOnce')
				if (mp4frag.segment) {
					socket.emit('segment', mp4frag.segment)
				} else {
					mp4frag.once('segment', onSegment)
				}
			}
		
			// client request
			const pauseReq = () => { // same as stop, for now. will need other logic todo
				mp4frag.removeListener('segment', onSegment)
			}
		
			// client request
			const resumeReq = () => { // same as segment, for now. will need other logic todo
				mp4frag.on('segment', onSegment)
				// may indicate that we are resuming from paused
			}
		
			// client request
			const stopReq = () => {
				mp4frag.removeListener('segment', onSegment)
				mp4frag.removeListener('initialized', onInitialized)
			}
		
			// listen to client messages
			socket.on('message', (msg) => {
			// console.log(`${namespace} message : ${msg}`)
				switch (msg) {
					case 'mime' :// client is requesting mime
						mimeReq()
						break
					case 'initialization' :// client is requesting initialization segment
						initializationReq()
						break
					case 'segment' :// client is requesting a SINGLE segment
						segmentReq()
						break
					case 'segments' :// client is requesting ALL segments
						segmentsReq()
						break
					case 'pause' :
						pauseReq()
						break
					case 'resume' :
						resumeReq()
						break
					case 'stop' :// client requesting to stop receiving segments
						stopReq()
						break
				}
			})
		
			socket.on('disconnect', () => {
				stopReq()
				console.log('\x1b[36m%s\x1b[0m', `a follower disconnected from stream "${namespace}"`)

				callback(true, parameters.id, 'disconnected stream')
			})
		})
	}
}