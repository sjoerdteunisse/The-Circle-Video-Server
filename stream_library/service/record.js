const config = require('../config')
const Recorder = require('./recorder')
const logger = require('../../back_end_server/src/config/winston');

var recorders = new Map();

function createRecorder(uri, clientId, streamId) {
    logger.info('Recorder Controller: A stream has been started on ' + streamId + ' and is being recorded');
    recorder = new Recorder({
        url: uri,
        timeLimit: 600, // time in seconds for each segmented video file
        folder: 'recordings',
        name: streamId.split('/')[1],
        directoryPathFormat: 'YYYY-MM-DD',
    })
    recorders.set(clientId, recorder);
}

function getRecorder(clientId) {
    return recorders.get(clientId);
}

function removeRecorder(clientId) {
    logger.info('Recorder Controller: The ' + clientId + ' stream stopped and recorder will stop recording ');
    recorders.delete(clientId);
}

module.exports = {
    createRecorder: createRecorder,
    getRecorder: getRecorder,
    removeRecorder: removeRecorder
}