var users = {};
var usersStreamObjects = {};
var historyUsers = {};
const logger = require('../../back_end_server/src/config/winston');
const pool = require('../../back_end_server/src/config/db')
var Decimal = require('decimal.js');
const trueYouUserModel = require('../../back_end_server/src/models/trueYouUser.model')

function createStreamer(streamId, clientId, done) {
    var PhoneNumber = clientId.split("/");
    historyUsers[clientId] = Date.now();
    logger.info('Streamer service: ' + clientId + " started streaming on : " + historyUsers[clientId]);

    //Search for the user in database.
     const clientQuery = 'SELECT * FROM trueyouusers WHERE phone = ?';
     pool.query(clientQuery,
         [PhoneNumber[1]],
         function (err, rows, fields) {
             if (rows.length == 0) {
                logger.info('Streamer service: ' + PhoneNumber[1] + ' tried to stream without a valid account ');
                console.log('this dude has no accountee ' + PhoneNumber[1])
                //Don't do anything, it might be someone that tried to stream on a url that doesn't exsits for some reason. 
             } else {
                var trueYouUser = new trueYouUserModel(rows[0].firstname, rows[0].prefix, rows[0].lastname, rows[0].avatarUrl, rows[0].description, rows[0].email, rows[0].phone, rows[0].country, rows[0].dateOfBirth, rows[0].satoshiBalance, rows[0].residence, rows[0].active, rows[0].publicKey, rows[0].hashPublicKey, rows[0].hashUserInfo, rows[0].digiSig)
		     trueYouUser['url'] = clientId;
		     trueYouUser['thumbnailUrl'] = '/api/' + streamId + '/jpeg/image.jpeg'
		     trueYouUser['ffmpeg'] = null;
		     users[streamId] = trueYouUser;
		     done();
             }
         })
}

function removeStreamer(streamId) {
	var user_id = users[streamId];
	if (typeof user_id !== 'undefined') {
	    

		//delete ffmpegrespawn object
		usersStreamObjects[streamId].ffmpeg.stop()
		console.log('\x1b[41m%s\x1b[0m', 'Killed ffmpeg');
		delete usersStreamObjects[streamId];

        //calculate the seconds between the moment the streamer started and ended the stream.
        var millis = Date.now() - historyUsers[user_id.url]
        var seconds =   Math.floor(millis / 1000);
        
        //give the user that streamed there amount of satoshi for streaming. 
        hours = Math.floor(seconds / 3600);
        
        //split the username so the user becomes recognizable
        var user_name = user_id.url.split('/')
    
        logger.info('Streamer service: ' + user_name[1] + " stopped streaming, and streamed for : " + seconds);
        
        //See if user has more then 1 hour of streaming after deleting it's stream
        if(!hours == 0){
            amount_satoshi = 25 * (hours * (hours + 1)) //forumla for calculating the amount. Sum of Gauss modified to make it worth streaming.
            
            //Method to make connection to the database.
            giveSatoshi(user_name[1], amount_satoshi)
            
            logger.info('Satoshi Service: ' + user_name[1] + " Streamed for " + hours + " and earned " + amount_satoshi + " Satoshi");
                
            //Remove the user from the streamers list
        }else{
            console.log(user_name[1] + " hasn't streamed for at least one hour");
        }
        delete users[streamId]
    }
}

//return all live streamers
function getStreamers(){
    return users;
}

//return all live streamers
function getStreamersEncoding(){
	return usersStreamObjects;
    }

function setEncodingObjects(streamId, ffmpegObj, mp4fragObj, pipe2jpegObj) {

	object = {
			ffmpeg: ffmpegObj,
			mp4frag: mp4fragObj,
			pipe2jpeg: pipe2jpegObj
	}
	
	usersStreamObjects[streamId] = object;
}

function giveSatoshi(user_id, satoshiAmount) {
    //Setup query
    const clientQuery = 'SELECT satoshiBalance FROM trueyouusers WHERE phone = ?';
    pool.query(clientQuery,
        [user_id],
        function (err, rows, fields) {
            if (rows.length == 0) {
                logger.info('Streamer service: '+user_id+' streamed without a valid account, and got there Satoshi lost ');
                console.log('this dude has no account ' + user_id)
                //Don't do anything, it might be someone that tried to stream on a url that doesn't exsits for some reason. 
            } else {
                //calculate the new balance, while using Decimal.js to determin the right amount of satoshi. 
                var balance = rows[0].satoshiBalance
                dec_balance = new Decimal(balance)
                new_dec_balance = dec_balance.plus(satoshiAmount);
                
                // Post everything to server
                const InsertSatoshi = "UPDATE trueyouusers set satoshiBalance = ? where phone = ?";
                pool.query(InsertSatoshi,
                    [parseInt(new_dec_balance), user_id],
                    function (err, rows, fields) {
                        if (err) {
                            console.log(err)
                        }
                    })
            }
        })
}

module.exports = {
    createStreamer,
    removeStreamer,
	getStreamers,
	setEncodingObjects,
	getStreamersEncoding
    
}