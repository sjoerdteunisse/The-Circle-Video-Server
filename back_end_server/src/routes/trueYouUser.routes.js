const router = require('express').Router()
const trueYouUserController = require('../controllers/trueYouUser.controller')
const authController = require('../controllers/auth.controller')
var path = require("path");

// Endpoint to register an user
router.post('/User/Register', trueYouUserController.register)
// Endpoint to handle authentication requests
router.post('/Auth', authController.auth)

// Endpoint to save a new avatar
router.post('/User/NewAvatar', trueYouUserController.saveNewAvatar)
// Endpoint to get the satoshi balance
router.get('/User/Satoshibalance/:phoneNr', trueYouUserController.getSatoshi)

module.exports = router
