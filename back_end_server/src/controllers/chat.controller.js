const errorModel = require('../models/error.model')
const pool = require('../config/db')
const crypto = require('crypto');
const logger = require('../config/winston');
const keysOfServer = require('../config/key');
var escape_message;
module.exports = {
   // GET all messages from chat ever sent to a user.
   getMessages(req, res, next) {
      const _io = io;
      console.log("GET /Messages Endpoint Hit")
      var phoneNumber = req.params.streamPhoneNr
      const phoneQuery = 'SELECT id, firstname, prefix, lastname, avatarUrl FROM trueyouusers WHERE trueyouusers.phone = ?';
      pool.query(phoneQuery,
         [phoneNumber],
         function (err, rows, fields) {
          if(typeof rows === 'undefined') {
            return next(new errorModel("No user found", 404)) 
          }
          if(rows.length < 1){
            return next(new errorModel("No user found", 404))
         }
            var buffer = ""
            var streamerId = rows[0].id
            const chatQuery = 'SELECT t.firstname, t.prefix, t.lastname, t.avatarUrl, c.message, c.sender_id, c.timestamp, c.streamer_id FROM chat c, trueyouusers t WHERE  c.streamer_id = ? AND c.sender_id = t.id ORDER BY c.timestamp';
            pool.query(chatQuery,
               [streamerId],
               function (err, rows, fields) {
                  var i = 0;
                  var messages = [];
                  rows.forEach(element => {
                     var streamerFirstname = rows[i].firstname
                     var streamerPrefix = rows[i].prefix
                     var streamerLastname = rows[i].lastname
                     var streamerAvatarUrl = rows[i].avatarUrl
                     var fullName = (streamerPrefix) ? streamerFirstname + " " + streamerPrefix + " " + streamerLastname : streamerFirstname + " " + streamerLastname;
                     var date = rows[i].timestamp;
                     var hours = date.getHours();
                     var minutes = date.getMinutes();
                     var seconds = date.getSeconds();
                     var time = pad(hours) + ":" + pad(minutes) ;
                     // + ":" + pad(seconds)
                     var day = date.getDate();
                     var month = date.getMonth(); //Be careful! January is 0 not 1
                     var year = date.getFullYear();
                     var dateString = day + "-" +(month + 1) + "-" + year;
                     var message = {};
                     var msg = "";

                     if (buffer != dateString){
                        buffer = dateString
                        msg += '<div class="chatMessage col-xs-12"><div class="dateMessage col-sm-12 col-xs-12"><p>'+ dateString +'</p></div></div>';
                     }

                     var newstring = rows[i].message.replace(/(<([^>]+)>)/ig,"");

                     if(streamerId == rows[i].sender_id){
                         msg += `<div class="chatMessage col-xs-12"><span class="isStreamer">Streamer</span> <div class="col-sm-2 nopadding img"><img class="userImg" src="data:image/png;base64, ` + streamerAvatarUrl + `"/></div><div class="col-sm-10 nopadding"> <p> ` + time + ` - <span class='chatUserName'>` + fullName + `</span></p> ` + newstring + `</div></div>`;                   
                     }else{
                         msg += `<div class="chatMessage col-xs-12"><div class="col-sm-2 nopadding img"><img class="userImg" src="data:image/png;base64, ` + streamerAvatarUrl + `"/></div><div class="col-sm-10 nopadding"> <p> ` + time + ` - <span class='chatUserName'>` + fullName + `</span></p> ` + newstring + `</div></div>`;                   
                     }

                    
                     // Sign signature
                     const sign = crypto.createSign('SHA256');
                     sign.write(msg);
                     sign.end();
                     const signature = sign.sign(keysOfServer.privateKeyServer, 'base64');
                     
                     message['msg'] = msg;
                     message['digiSig'] = signature;
                     messages.push(message)
                     i++;
                  });
                  res.send(messages)
               })
         })
   },

   // POST message to chat and emit the message to all connected clients (that are connected to the same room)
   addMessage(req, res, next) {
      console.log("POST /Messages Endpoint Hit")
      var streamNr = req.body.streamerPhone
      const phoneQuery = 'SELECT id, firstname, prefix, lastname, avatarUrl FROM trueyouusers WHERE trueyouusers.phone = ?';
      pool.query(phoneQuery,
         [streamNr],
         function (err, rows, fields) {
            if(rows === undefined) {
               return next(new errorModel("No user found", 404)) 
             }
             if(rows.length < 1){
               return next(new errorModel("No user found", 404))
            }
            var streamerId = rows[0].id
            var today = new Date();
            var streamerTimestamp = pad(today.getHours()) + ":" + pad(today.getMinutes()) ;
            var day = today.getDate();
            var month = today.getMonth(); //Be careful! January is 0 not 1
            var year = today.getFullYear();
            var dateString = day + "-" +(month + 1) + "-" + year;
            var message = {};
            var msg = "";

            const chatQuery = 'SELECT id FROM chat WHERE streamer_id = ? AND DATE(`timestamp`) = CURDATE()';
            pool.query(chatQuery,
               [streamerId],
               function (err, rows, fields) {
                  if(rows.length < 1) {
                     msg += '<div class="chatMessage col-xs-12"><div class="dateMessage col-sm-12 col-xs-12"><p>'+ dateString +'</p></div></div>';
               }
            })
            //+ ":" + today.getSeconds()
            var clientNr = req.body.clientPhone
            const clientQuery = 'SELECT id, firstname, prefix, lastname, avatarUrl, publicKey FROM trueyouusers WHERE trueyouusers.phone = ?';
            pool.query(clientQuery,
               [clientNr],
               function (err, rows, fields) {
                  var clientId = rows[0].id
                  var streamerFirstname = rows[0].firstname
                  var streamerPrefix = rows[0].prefix
                  var streamerLastname = rows[0].lastname
                  var streamerAvatarUrl = rows[0].avatarUrl
                  var fullName = (streamerPrefix) ? streamerFirstname + " " + streamerPrefix + " " + streamerLastname : streamerFirstname + " " + streamerLastname
                  // Verify integrity
                  var verifier = crypto.createVerify('RSA-SHA256')
                  verifier.update(req.body.message, 'utf8')
                  // Retrieve the public key
                  var publicKey = rows[0].publicKey
                  // Get digital signature
                  const digiSig = req.body.digiSig
                  // Verify

                  const integrityCheck = verifier.verify(publicKey, digiSig, 'base64')
                  if (integrityCheck == false) {
                     logger.info('Chat controller: Integrity has been violated')
                     return next(new errorModel("The integrity of this request was violated", 400))
                  }  
                  
                  escape_message = req.body.message.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');

                  const insertChat = "INSERT INTO chat (message, sender_id, streamer_id) VALUES (?, ?, ?)";
                  var message = []
                  pool.query(insertChat,
                     [escape_message, clientId, streamerId],
                     function (err, rows, fields) { })
                  var message = {};
                  
                  if(clientId == streamerId){
                     msg += `<div class="chatMessage col-xs-12"><span class="isStreamer">Streamer</span> <div class="col-sm-2 nopadding img"><img class="userImg" src="data:image/png;base64, ` + streamerAvatarUrl + `"/></div><div class="col-sm-10 nopadding"> <p>` + streamerTimestamp + ` - <span class='chatUserName'>` + fullName + `</span></p> ` + escape_message + `</div></div>`;
                  }
                  else{
                     msg += `<div class="chatMessage col-xs-12"><div class="col-sm-2 nopadding img"><img class="userImg" src="data:image/png;base64, ` + streamerAvatarUrl + `"/></div><div class="col-sm-10 nopadding"> <p>` + streamerTimestamp + ` - <span class='chatUserName'>` + fullName + `</span></p> ` + escape_message + `</div></div>`;
                  }
                  
                  // Sign signature
                  const sign = crypto.createSign('SHA256');
                  sign.write(msg);
                  sign.end();
                  const signature = sign.sign(keysOfServer.privateKeyServer, 'base64');
                  message['msg'] =  msg;
                  message['digiSig'] = signature;
                  io.sockets.in(streamNr).emit(streamNr, message, streamNr);
                  logger.info('Chat Controller: ' + clientId + " send the message in  " + escape_message + " to :" + streamNr);
                  res.sendStatus(200)
               })
         })
   }
}

function pad(num) {
   return ("0" + num).slice(-2);
}





