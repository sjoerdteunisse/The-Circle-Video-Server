const router = require('express').Router()
const chatController = require('../controllers/chat.controller')

router.get('/:streamPhoneNr/:clientPhoneNr', chatController.getMessages);
router.post('/message', chatController.addMessage);

module.exports = router
