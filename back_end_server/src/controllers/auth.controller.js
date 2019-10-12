const trueYouUserModel = require('../models/trueYouUser.model')
const errorModel = require('../models/error.model')
const pool = require('../config/db')
const crypto = require('crypto');
var qs = require('querystring');
var request = require('request');
var os = require( 'os' );
const logger = require('../config/winston');
var streamers = require('../../../stream_library/service/streamers')
const keysOfServer = require('../config/key');

module.exports = {
	// Endpoint to authenticate a request
    auth(req, res, next) {
        console.log('auth.controller.auth called')
        // Null check
        if (req.body.phoneNumber == null || req.body.digitalSignature == null){
            return next(new errorModel("Request contains empty values", 400)) 
        }
        // Query user info matching specified phone number
        var phoneNumber = req.body.phoneNumber
        const query = 'SELECT * FROM trueyouusers WHERE trueyouusers.phone = ?';
        pool.query(query,
			[phoneNumber],
			function (err, rows, fields) {
				// Throw an error if the query fails
				if (err) {
					console.log(err)
					return next(new errorModel(err, 500))
                }

                // Throw an error if no users were found
				if (rows == "") {
                    logger.info('Authenticated: Someone logged in with the wrong phone number');
					return next(new errorModel('Phone number of said TrueYouUser does not exist', 400))
				}
				if (phoneNumber === rows[0].phone) {
					if (rows.length === 1) {
                        // Check if account is active
                        const active = rows[0].active
                        if (active != 1) {
                            logger.info('Authenticated: ' + rows[0].phoneNumber + " isn't active yet.");
                            return next(new errorModel('Account is not active', 400))
                        }    
                        // Initalize verifier 
                        var verifier = crypto.createVerify('RSA-SHA256')
                        verifier.update(phoneNumber, 'utf8')
                        // Retrieve the public key
                        const publicKey = rows[0].publicKey
                        // Get digital signature
                        const digiSig = req.body.digitalSignature
                        // Verify
                        const integrityCheck = verifier.verify(publicKey, digiSig, 'base64')
                        if (integrityCheck == false){
                            logger.info('Authenticated: ' + rows[0].phoneNumber + " was involved during a violation of the integrity check.");
                            return next(new errorModel("The integrity of this request was violated", 400)) 
                        }
                        
						// Hash the response userInfo so we can check for integrity on the client side
						var raw = rows[0].firstname + rows[0].lastname + rows[0].description + rows[0].email + rows[0].residence + rows[0].country;
						// var rawHash = crypto.createHash('sha256').update(raw).digest('hex')
						// var buffer = new Buffer.from(JSON.stringify(rawHash)).toString('hex')
                        
                        const sign = crypto.createSign('SHA256');
                        sign.write(raw);
                        sign.end();
                        const signature = sign.sign(keysOfServer.privateKeyServer, 'base64');

                        if(rows[0].prefix != null) {
                            logger.info('Authenticated: ' + rows[0].firstname + ' ' + rows[0].prefix + ' ' + rows[0].lastname);
                        } else {
                            logger.info('Authenticated: ' + rows[0].firstname + ' ' + rows[0].lastname);
                        }

                        res.status(200).json({
                            result: {	
                                username: rows[0].username,
								firstname: rows[0].firstname,
                                prefix: rows[0].prefix,
                                lastname: rows[0].lastname,
                                description: rows[0].description,
                                email: rows[0].email,
                                residence: rows[0].residence,
                                country: rows[0].country,
                                dateOfBirth: rows[0].dateOfBirth,
                                satoshi: rows[0].satoshiBalance,
								avatarUrl: rows[0].avatarUrl,
								digiSig: signature
                                }
							}).end()
					} else {
						return next(new errorModel('Found more than one account with said phone number', 400))
					}
				} else{
					return next(new errorModel('Phone number does not match ', 400))
				}
			})
    },
}