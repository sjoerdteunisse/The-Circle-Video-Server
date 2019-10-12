const trueYouUserModel = require('../models/trueYouUser.model')
const errorModel = require('../models/error.model')
const pool = require('../config/db')
const keysOfServer = require('../config/key');
const crypto = require('crypto');
var fs = require('fs');
var logger = require('../config/winston');
var privateKeyOfServer = keysOfServer.privateKeyServer;

module.exports = {
	// Endpoint to register a user
	register(req, res, next) {
		console.log('trueYouUser.controller.register called')

		// Check if the request is not empty
		if (req.body.firstname == null || req.body.lastname == null || req.body.email == null || req.body.phone == null || req.body.country == null || req.body.dateOfBirth == null || req.body.residence == null || req.body.publicKey == null || req.body.digiSig == null){
			logger.info("TrueYouUser Controller: someone tried to create a account while missing some value's");
			return next(new errorModel("Request contains empty values", 400)) 
		}

		var bitmap = fs.readFileSync("./back_end_server/images/avatar1.png");

		if (req.body.avatarUrl == null) { req.body.avatarUrl = Buffer(bitmap).toString('base64'); }
		if (req.body.satoshiBalance == null) { req.body.satoshiBalance = 0.00; }
		if (req.body.description == null) { req.body.description = ""; }
		if (req.body.prefix == null) { req.body.prefix = ""; }
		if (req.body.active == null) { req.body.active = 0; }

		var firstname = req.body.firstname
		var prefix = req.body.prefix
		var lastname = req.body.lastname
		var avatarUrl = req.body.avatarUrl
		var description = req.body.description
		var residence = req.body.residence
		var email = req.body.email
		var phone = req.body.phone
		var country = req.body.country
		var dateOfBirth = req.body.dateOfBirth
		var satoshiBalance = req.body.satoshiBalance

		const trueYouUser = new trueYouUserModel(firstname, prefix, lastname, avatarUrl, description,email, phone, country, dateOfBirth, satoshiBalance, residence, req.body.active, req.body.publicKey, req.body.digiSig)
		
		// Recreate big userInfo string 
		var userInfoString = trueYouUser.firstname + trueYouUser.lastname + trueYouUser.description + trueYouUser.phone + trueYouUser.email + trueYouUser.country + trueYouUser.dateOfBirth + trueYouUser.residence + req.body.publicKey
		// Initalize verifier 
		var verifier = crypto.createVerify('RSA-SHA256')
		verifier.update(userInfoString, 'utf8')
		// Verify
		const integrityCheck = verifier.verify(req.body.publicKey, req.body.digiSig, 'base64')

		if (integrityCheck == false) {
			logger.info('TrueYouUser Controller: ' + req.body.phone + " got involved with a violation of the integrity.");
			return next(new errorModel("The integrity of this request was violated", 400)) 
		}

		trueYouUser.firstname = trueYouUser.firstname.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.prefix = trueYouUser.prefix.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.lastname = trueYouUser.lastname.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.description = trueYouUser.description.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.phone = trueYouUser.phone.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.email = trueYouUser.email.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.residence = trueYouUser.residence.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');
		trueYouUser.country = trueYouUser.country.replace(/\&/g, '&amp;').replace(/\</g, '&lt').replace(/\>/g, '&gt').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27').replace(/\//g, '&#x2F');

		const query = "INSERT INTO `trueyouusers` (`firstname`, `prefix`, `lastname`, `avatarUrl`, `description`, `email`, `phone`, `country`, `dateOfBirth`, `satoshiBalance`, `residence`, `active`, `publicKey`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		
		pool.query(query,
			[trueYouUser.firstname, trueYouUser.prefix, trueYouUser.lastname, trueYouUser.avatarUrl, trueYouUser.description, trueYouUser.email, trueYouUser.phone, trueYouUser.country, trueYouUser.dateOfBirth, trueYouUser.satoshiBalance, trueYouUser.residence, trueYouUser.active, trueYouUser.publicKey],
		function (err, rows, fields) {
			// Connection is automatically closed when the query is executed
			if (err) {
				console.log(err)	

				if(err.code == "ER_DUP_ENTRY" && err.sqlMessage.indexOf("email") != -1) {
					return next(new errorModel('This emailaddress is already in use', 409))
				}
				return next(new errorModel(err, 500))
			}
			if (rows && rows.affectedRows === 1) {
				logger.info('TrueYouUser Controller: A new trueYouUser has been created with the phoneNumber: ' + trueYouUser.phone);
				// Create hash of user info to send with response for integrity checking
				var raw = trueYouUser.firstname + trueYouUser.lastname + trueYouUser.email
				const sign = crypto.createSign('SHA256');
				sign.write(raw);
				sign.end();
				const signature = sign.sign(privateKeyOfServer, 'base64');

				// Return the most important information about the added user
				res.status(200).json({
					result: {
						firstname: req.body.firstname,
						lastname: req.body.lastname,
						email: req.body.email,
						digSignature: signature
					}
				}).end()
			} else {
				return next(new errorModel(rows, 500))
			}
		})
	},
	// Endpoint to save a new avatar
	saveNewAvatar(req, res, next) {
		console.log("In saveNewAvatar method");

		if(req.body.avatarAsBase64 == null || req.body.phoneNumber == null || req.body.pubKey == null || req.body.digiSigAvatar == null) {
			return next(new errorModel('A required field is missing', 400));
		} else {
			// Initalize verifier 
			var verifier = crypto.createVerify('RSA-SHA256')
			verifier.update(req.body.avatarAsBase64, 'utf8')

			// Verify
			const integrityCheck = verifier.verify(req.body.pubKey, req.body.digiSigAvatar, 'base64')
			if (integrityCheck == false){
				return next(new errorModel("The integrity of this request was violated", 400)) 
			}

			const query = "UPDATE trueyouusers SET avatarUrl = ? WHERE phone = ?";
			
			pool.query(query,
				[req.body.avatarAsBase64, req.body.phoneNumber],
			function (err, rows, fields) {
				if (err) {
					console.log(err)
					return next(new errorModel(err, 500))
				}
				if (rows && rows.affectedRows === 1) {
					res.status(200).json({status: "ok"}).end()
					logger.info('TrueYouUser Controller: ' + req.body.phoneNumber + " changed there avatar");
				} else {
					return next(new errorModel(rows, 500))
				}
			})
		}
	},
	// Endpoint to get the satoshi balance
	getSatoshi(req, res, next) {
		console.log("In getSatoshi method")
		// Get parameter phonenumber
		const phoneNr = req.params.phoneNr
		
		// Get satoshi balance of this user
		pool.query("SELECT * FROM trueyouusers WHERE phone = ?", [phoneNr], function (err, rows, fields) {
				if(err){
					console.log(err)
					return next(new ApiError(err, 500))
				}
	
				const sign = crypto.createSign('SHA256');
				sign.write(rows[0].satoshiBalance);
				sign.end();
				const signature = sign.sign(privateKeyOfServer, 'base64');
	
				// Return the satoshi balance
				res.status(200).json({
					result: {
						satoshiBalance: rows[0].satoshiBalance,
						digSignature: signature
					}
				}).end()
		})
	},
}