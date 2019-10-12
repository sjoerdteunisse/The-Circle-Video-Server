$(document).ready(function () {

    $('.menu-item').each(function (i, obj) {
        var hrefOfNav = obj.href;
        var currentPage = window.location.href;

        if ($.contains(obj.classList, "active")) {
            obj.classList.remove("active");
        }

        if (currentPage == hrefOfNav) {
            obj.classList.add("active")
        }
    });

    $("#searchStream").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#streamOverviewList .viewStreams").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

function authenticate() {
    var telnr = document.getElementById("txtphonenr").value;
    var privatekey = document.getElementById("txtprivatekey").value;
    var request;

    var sign = new JSEncrypt();
    sign.setPrivateKey(privatekey);
    var signature = sign.sign(telnr, CryptoJS.SHA256, "sha256");

    request = $.ajax({
        url: "/api/Auth",
        type: "post",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ "phoneNumber": `${telnr}`, "digitalSignature": `${signature}` })
    });

    // Callback handler that will be called on success
    request.done(function (response, textStatus, jqXHR) {
        // Set sessionStorage 
        sessionStorage.setItem('privkey', privatekey);
        sessionStorage.setItem('phone', telnr);
        window.location.href = "/stream";
    });

    // Callback handler that will be called on failure
    request.fail(function (jqXHR, textStatus, errorThrown) {
        // Login failed
        $("#loginError").removeClass("d-none");
    });
}
function messageScrollDown() {
    $(".messages").animate({
        scrollTop: $(".messages .chatMessage:last-child").offset().top
    }, 100);
}

function logout() {
    sessionStorage.removeItem('privkey');
    sessionStorage.removeItem('phone');
    window.location.href = "/";
}

function checkPermission() {
    var privkeyOfLS = sessionStorage.getItem('privkey');
    var phone = sessionStorage.getItem('phone');
    if (phone == null || privkeyOfLS == null) {
        // Null, so just throw a login failed.
        var url = window.location.href
        var arr = url.split("/");
        var rootPath = arr[0] + "//" + arr[2];

        document.body.innerHTML = "<h1>You do not have permission to see this page</h1><p>Please click <a href='" + rootPath + "'>here</a> to  go to the login screen</p>";
        $("#loginError").removeClass("d-none");
    } else {
        var sign = new JSEncrypt();
        sign.setPrivateKey(privkeyOfLS);
        var signature = sign.sign(phone, CryptoJS.SHA256, "sha256");

        request = $.ajax({
            url: "/api/Auth",
            type: "post",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({ "phoneNumber": `${phone}`, "digitalSignature": `${signature}` })
        });
        // Callback handler that will be called on success
        request.done(function (response, textStatus, jqXHR) {
            // do nothing, everything is fine.
        });

        // Callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // Login failed
            var url = window.location.href
            var arr = url.split("/");
            var rootPath = arr[0] + "//" + arr[2];

            document.body.innerHTML = "<h1>You do not have permission to see this page</h1><p>Please click <a href='" + rootPath + "'>here</a> to  go to the login screen</p>";
            $("#loginError").removeClass("d-none");
        });
    }
}

// Save all selected streamer phone Nr's as a array in a JSON object into HTML5 local storage.
function viewStreams() {
    var data = [];
    $(".streamCheckbox:checked").each(function () {
        var obj = { url: $(this).val() }
        data.push(obj)
        sessionStorage.setItem("streams", JSON.stringify(data));
    });

    if (Object.keys(data).length <= 1) {
        window.location.href = "/stream/1";
    }
    else {
        window.location.href = "/stream/4";
    }
}

function checkIfStreamExist(number) {
    var request = $.get("/stream/getStreams", function (data) {
        var amountOfStreams = Object.keys(data).length;
        // Count them
        var buffer = 0
        if (amountOfStreams > 0) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    if (data[key].phone == number) {
                        buffer++
                    }

                }

            }
            if (buffer == 0) {
                $(".nopadding." + number).html("<p class='col-xs-12 col-md-12'>This transparent person is no longer streaming. Click here to redirect to the <a href='/stream/streamoverview'>stream overview</a> or select a new stream below.</p>")
            }

        }
        else {
            window.location.href = "/stream/streamoverview";
        }

    });

}

function getStreamers() {
    $("#streamOverviewList").html("");
    // Get all users who are streaming to the server
    var request = $.get("/stream/getStreams", function (data) {
        var amountOfStreams = Object.keys(data).length;
        // Count them
        if (amountOfStreams > 0) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    // Checkbox for each streamer
                    var streams = `<div class="viewStreams col-xs-12 col-md-3"><input type="checkbox" class="streamCheckbox" name="CheckBoxInputName" value="` + data[key].phone + `" id="CheckBox` + key + `" />
                        <label class="list-group-item" for="CheckBox` + key + `"><div class="streamvideo">
                            <div class="overviewImg "><img src="/stream` + data[key].thumbnailUrl + `"><div class="plyIcon"><i class="fa fa-play-circle-o"></i></div></div>
                            <div class="streamDescription">
                                <p class="descriptionTitle"><img src="data:image/png;base64,` + data[key].avatarUrl + `" alt="Red dot" style="height:25px; border-radius: 100%"/>   ` + data[key].firstname + ` ` + data[key].prefix + ` ` + data[key].lastname + ` | ` + data[key].country + `</p>
                            </div>
            </div></label></div>`;

                    $("#streamOverviewList").append(streams);
                }

            }

            $("#streamOverviewList").on('click', '[name="CheckBoxInputName"]', function (e) {
                var selectedStreams = $('[name="CheckBoxInputName"]:checked');

                if (selectedStreams.length > 4) {
                    e.preventDefault();
                    $('#overviewErrMax').removeClass("d-none");
                    return;
                }
                // document.getElementById("trueYouLogin")

                if (document.getElementById("overviewSubmit") == null) {
                    $("#buttondiv").append('<input type="submit" id="overviewSubmit" class="viewStreams" name="viewStreams" onclick="viewStreams()" value="View stream(s)"/>');
                }
                if (selectedStreams.length < 1) {
                    $("#overviewSubmit").remove();
                }

            });
        }
        // Display a message that no streamers are streaming as of right now.
        else {
            $("#streamOverviewList").append("<p class='text-center'>There are currently no streams available</p>");
        }
    });
}

function scanner() {
    let scanner = new Instascan.Scanner({ video: document.getElementById('preview') });

    scanner.addListener('scan', function (content) {

        var keyStart = "-----BEGIN PRIVATE KEY-----"

        if (content.includes(keyStart)) { //Defined split in client.
            var strings = content.split("@VX");
            document.getElementById('txtphonenr').value = strings[0];
            document.getElementById('txtprivatekey').value = strings[1];
            document.getElementById("trueYouLogin").click();

        }
    });

    Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
            scanner.start(cameras[0]);
        } else {
            console.error('No cameras found.');
        }
    }).catch(function (e) {
        console.error(e);
    });
}

function serverSocket() {
    // Connect to the server socket
    var socket = io.connect();
    // Get all streamers the client selected from HTML5 sessionStorage. Todo: Nullcheck

    var html = "";
    // Loop through JSON Array. Create a stream div & chat for each streamer dynamically.
    for (var i = 0; i < streamURLs.length; i++) {
        var obj = streamURLs[i];
        var phone = "" + obj.url;



        // Get the phone number of the streamers' url.
        var html = `<div class="col-xs-12 col-md-6 nopadding ` + phone + `">
                <div class="col-xs-12 col-md-12">
                    <div class="streamvideo">
                        <video autoplay data-namespace="`+ phone + `" data-controls="startstop|fullscreen|snapshot|cycle"></video>
                    </div>
                </div>
                <div class="col-xs-12 col-md-12">
                    <div id="chat" class="chat">
                        <div class="chatbar chatpadding">
                            <p class="chatBarTitle">TrueYou chat | `+ phone + `</p>
                        </div>
                        <div class="chatdisplay col-xs-12  chatpadding">
                            <div id="messagediv` + phone + `" class="messages ` + phone + `">

                            </div>
                            <div class="chatMessage col-xs-12">
                                <div class="col-sm-2 nopadding img"></div>
                                <div class="webflow-style-input col-xs-10">
                                    <input id="message`+ phone + `" class="sendMessage" type="text" maxlength="150" onkeyup="keyUp(event, ` + phone + `, ` + phone.length + `)" placeholder="Send a message"></input>
                                    <button id="send" class="_3M-N-" onclick="sendMessage('` + phone + `')"><span data-icon="send" class="" ><svg id="Layer_1"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                            height="24">
                                            <path fill="#263238" fill-opacity=".45"
                                                d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z">
                                            </path>
                                        </svg></span></button>
                                </div>
                            </div>
                            <p id="inputCharacters` + phone + `" class="inputCharacters">150/150 characters left</p>
                        </div>
                    </div>
                </div>
            </div>`;
        $(".wrapper.streams .row").append(html);
        // Retrieve all the messages ever sent to a user.
        getMessages(phone);
        checkIfStreamExist(phone)
        // 'Join' the streamers' socketIO room.
        socket.emit('create', phone);
        // Listen for server responses to this room.
        socket.on(phone, addPostedMessage);

        //$(document).ready(function () {
        socket.emit('join', phone)
        //});


    };
    window.addEventListener("beforeunload", function () {
        for (var i = 0; i < streamURLs.length; i++) {
            var obj = streamURLs[i];
            var phone = "" + obj.url;
            socket.emit("leave", phone)
        }
    }, false);
}

function serverSocketOne() {
    // Connect to the server socket
    var socket = io.connect();
    // Get all streamers the client selected from HTML5 sessionStorage. 

    var html = "";
    // Loop through JSON Array. Create a stream div & chat for each streamer dynamically.
    for (var i = 0; i < streamURLs.length; i++) {
        var obj = streamURLs[i];
        // Get the phone number of the streamers' url.
        var phone = "" + obj.url;

        checkIfStreamExist(phone)

        var html = `<div class="col-xs-12 col-md-12 nopadding ` + phone + `"><div class="col-xs-12 col-md-8 ` + phone + `">
                <div class="streamvideo">
			<video autoplay data-namespace="`+ phone + `" data-controls="startstop|fullscreen|snapshot|cycle"></video>
                </div>
            </div>
            <div class="col-xs-12 col-md-4">
                <div id="chat" class="chat">
                    <div class="chatbar chatpadding">
                        <p class="chatBarTitle">TrueYou chat | ` + phone + `</p>
                    </div>
                    <div class="chatdisplay col-xs-12  chatpadding">
                        <div id="messagediv` + phone + `" id="messages" class="messages ` + phone + `">

                        </div>
                        <div class="chatMessage col-xs-12">
                            <div class="col-sm-2 nopadding img"></div>
                            <div class="webflow-style-input col-xs-10">
                                <input id="message` + phone + `" class="sendMessage" maxlength="150" onkeyup="keyUp(event, ` + phone + `, ` + phone.length + `)" data-phone="` + phone + `" type="text" placeholder="Send a message"></input>
                                <button id="send" class="_3M-N-" onclick="sendMessage('` + phone + `')"><span data-icon="send" class=""><svg id="Layer_1"
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                            height="24">
                                            <path fill="#263238" fill-opacity=".45"
                                                d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z">
                                            </path>
                                        </svg></span></button>
                            </div>
                        </div>
                        <p id="inputCharacters` + phone + `" class="inputCharacters">150/150 characters left</p>
                    </div>
                </div>
            </div>
        </div>`;

        $(".wrapper.streams .row").append(html);
        // Retrieve all the messages ever sent to a user.
        getMessages(phone);
        // 'Join' the streamers' socketIO room.
        socket.emit('create', phone);
        // Listen for server responses to this room.
        socket.on(phone, addPostedMessage);

        //$(document).ready(function () {
        socket.emit('join', phone)
        //});

        window.onbeforeunload = function () {
            socket.emit("leave", phone)
        };
    };
}

function areWeLoggedIn() {
    var phone = sessionStorage.getItem('phone');
    var privkey = sessionStorage.getItem('privkey');

    if (phone != null && privkey != null) {
        window.location.replace("/stream");
    }
}

function keyUp(event, number, length) {
    if (number.length != length) {
        number = "0" + number;
    }

    var element = $("#message" + number)
    var inputLenght = element.val().length
    var amountOfCharactersEl = $("#inputCharacters" + number);
    var maxChar = 150;
    var charLeft = maxChar - inputLenght;
    amountOfCharactersEl.text(charLeft + "/150 characters left")

    // Send message on enter
    if (event.keyCode === 13) {
        element.next('button').click();
    }
}