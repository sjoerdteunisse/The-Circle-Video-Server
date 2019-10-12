const config = require('../../webserver.config');
    const pool = require('../../back_end_server/src/config/db')
    const crypto = require('crypto');
    var integrityFrames = [];

    var net = require('net');
  
    global.a = new Array();
    let index = -1;
    let decrypted = "none";
    let publicKey = "invalid";
    var s = net.createServer(function (sock) {
    
        sock.on('data', function (data) {
            var body = "";
            body = body + data;

            var fromBodyData = JSON.parse(data);
            var seq = fromBodyData.sequence;
            var signature = fromBodyData.signature;
            var id = fromBodyData.id;

            index = a.findIndex(function(item, i){
                return item.id === id
            })
            // console.log("INDEX: "+index)
            if(index === -1){
                        pool.execute("SELECT phone, publicKey FROM trueyouusers WHERE phone = ?",
                            [id],
                            function (err, rows, fields) {
                                if (err) {
                                    console.log("Given Unique Identifier not found in database!")
                                }
                                a.push({
                                    "id": rows[0].phone,
                                    "publicKey": rows[0].publicKey
                                })
                            })
            }
            else{
                // Fetch public key
                publicKey = a[index].publicKey
                integrityFrames.push({
                    "sequence": seq,
                    "signature": signature,
                    "id": a[index].id,
                    "index": index
                });
            }
        });
    });

 

    
s.listen(config.integrityPort, config.integrityHost, function () {
    console.log('Server listening on ' + config.integrityHost + ':' + config.integrityPort);
});

module.exports = { AllintegrityFrames: integrityFrames};