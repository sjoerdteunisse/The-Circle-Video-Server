var crypto = require('crypto')

 class IntegrityObject {

    constructor(arrayBuffer){

        this.arrayBuffer =arrayBuffer;
        this.hash = crypto.createHash('sha256').update(arrayBuffer).digest("base64");
    }
} 

module.exports = IntegrityObject;
    