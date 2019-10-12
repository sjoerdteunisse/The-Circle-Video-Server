function genDigitalSignature(obj) {
  var privatekey = sessionStorage.getItem('privkey');
  var sign = new JSEncrypt();
  sign.setPrivateKey(privatekey);
  var signature = sign.sign(obj, CryptoJS.SHA256, "sha256");
  return signature;
}

// Send messages as a POST request to the server, and emit the message to all other who are connected to the same room. Todo: place this in scripts.js
function sendMessage(number) {
  var message = $("#message" + number + "").val();
  if (!message == ""){
    // message = message.replace(/(<([^>]+)>)/ig,"");
    var clientNr = sessionStorage.getItem('phone');
    // Get the clients phoneNr.
    var digitalSignature = genDigitalSignature(message);
    request = $.ajax({
      url: "/chat/message",
      type: "post",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({ "message": $("#message" + number + "").val(), "clientPhone": clientNr, "streamerPhone": number, "digiSig": digitalSignature })
    });
  }
};

// On servers' response; Add the message to the chat.
function addPostedMessage(message, number) {
  var verify = new JSEncrypt();
  verify.setPublicKey(serverPublicKey.key);
  var verified = verify.verify(message['msg'], message['digiSig'], CryptoJS.SHA256);
  if (verified == true){
    // Add the message
     $(".messages." + number + "").append(message['msg'])
  }
  // Clear the MSG box.
  $("#message" + number + "").val('')
  $("#inputCharacters" + number).text("150/150 characters left")

  var idOfDiv = "#messagediv" + number;
  if ($(idOfDiv).length > 0) {
    $(idOfDiv).scrollTop($(idOfDiv)[0].scrollHeight);
  }

}
// Get all messages ever sent to the streamer.
function getMessages(streamNr) {
  var clientNr = sessionStorage.getItem('phone');
  $.get('/chat/' + streamNr + "/" + clientNr, (data) => {
    addAllMessages(data, streamNr)
  })
}
// Add all messages ever sent to the streamer to the chat div 
function addAllMessages(message, number) {
  message.forEach(function (entry) {
    var verify = new JSEncrypt();
    verify.setPublicKey(serverPublicKey.key);
    var verified = verify.verify(entry['msg'], entry['digiSig'], CryptoJS.SHA256);
    if (verified == true){
      $(".messages." + number + "").append(entry['msg'])
    }
  });
  if ($('.messages .chatMessage:last-child').length > 0) {
    $(".messages").animate({
      scrollTop: $(".messages .chatMessage:last-child").offset().top
    }, 100)
  }
}