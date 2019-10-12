// var winston = require('winston');
const {transports, createLogger, format} = require('winston')

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: './logs/activity.log', level: 'info'})
    ]
});

module.exports = logger;