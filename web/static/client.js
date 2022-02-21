// get DOM elements
var 
    iceConnectionLog = document.getElementById('ice-connection-state'),
    iceGatheringLog = document.getElementById('ice-gathering-state'),
    signalingLog = document.getElementById('signaling-state');

var socket = io("/", {path: "/stream"})

var pc = null;

function createPeerConnection() {
    var config = {
        sdpSemantics: 'unified-plan'
    };

    //if (document.getElementById('use-stun').checked) {
    if(false){
        config.iceServers = [
            /*{urls:'stun:172.20.0.3:3478', "username":"username1", "credential":"key1"},*/
            {urls:
                
                ['turn:' + "172.20.0.3" + ':3478', 'turns:' + "172.20.0.3" + ':3478'], username:"username1", credential:"key1"
            }
        ];
    }

    pc = new RTCPeerConnection(config);

    // register some listeners to help debugging
    pc.addEventListener('icegatheringstatechange', function() {
        iceGatheringLog.textContent += ' -> ' + pc.iceGatheringState;
    }, false);
    iceGatheringLog.textContent = pc.iceGatheringState;

    pc.addEventListener('iceconnectionstatechange', function() {
        iceConnectionLog.textContent += ' -> ' + pc.iceConnectionState;
    }, false);
    iceConnectionLog.textContent = pc.iceConnectionState;

    pc.addEventListener('signalingstatechange', function() {
        signalingLog.textContent += ' -> ' + pc.signalingState;
    }, false);
    signalingLog.textContent = pc.signalingState;

    // connect audio / video
    pc.addEventListener('track', function(evt) {
        if (evt.track.kind == 'video')
            document.getElementById('video').srcObject = evt.streams[0];
       
    });

    return pc;
}

function negotiate() {
    return pc.createOffer().then(function(offer) {
        return pc.setLocalDescription(offer);
    }).then(function() {
        // wait for ICE gathering to complete
        return new Promise(function(resolve) {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
    }).then(function() {
        var offer = pc.localDescription;
        socket.emit("connect_to_server", {
            offer
        });
        
    }).catch(function(e) {
        alert(e);
    });
}


function start() {
    document.getElementById('start').style.display = 'none';

    pc = createPeerConnection();

    var constraints = {
        video: true,
        audio: true
    };


    if (constraints.video || constraints.audio) {
        if (constraints.video) {
            document.getElementById('media').style.display = 'block';
        }
        navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
            stream.getTracks().forEach(function(track) {
                pc.addTrack(track, stream);
            });
            return negotiate();
        }, function(err) {
            alert('Could not acquire media: ' + err);
        });
    } else {
        negotiate();
    }

    document.getElementById('stop').style.display = 'inline-block';
}


function pause() {
    // close transceivers
    if (pc.getTransceivers) {
        pc.getTransceivers().forEach(function(transceiver) {
            if (transceiver.stop) {
                transceiver.stop();
            }
        });
    }

    // close local audio / video
    pc.getSenders().forEach(function(sender) {
        sender.track.stop();
    });
}

function stop() {
    document.getElementById('stop').style.display = 'none';

    // close transceivers
    if (pc.getTransceivers) {
        pc.getTransceivers().forEach(function(transceiver) {
            if (transceiver.stop) {
                transceiver.stop();
            }
        });
    }

    // close local audio / video
    pc.getSenders().forEach(function(sender) {
        sender.track.stop();
    });

    // close peer connection
    setTimeout(function() {
        pc.close();
    }, 500);
}

socket.on('connect', function() {
    socket.emit('my_event', {data: 'I\'m connected!'});
});

socket.on('my_response', function(msg) {
    console.log(msg)
});

socket.on("connect_to_server_response", function(data) {
    pc.setRemoteDescription(data)
})


const video = document.getElementById("video")

video.addEventListener("play", (event) => {
    console.log("playing")
    video.srcObject.getTracks().forEach(t => t.enabled = true)
})


video.addEventListener("pause", (event) => {
    pause()
    video.srcObject.getTracks().forEach(t => t.enabled = !t.enabled)
    socket.emit("pause", {
        "time": video.currentTime
    })
})

video.addEventListener("ended", (event) => {
    console.log("ended")
    stop()
})