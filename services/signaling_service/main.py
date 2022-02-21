import logging
import os
import uuid
from dotenv import load_dotenv
import socketio

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaPlayer

ROOT = os.path.dirname(__file__)
logger = logging.getLogger("pc")
pcs = set()
sio = socketio.AsyncServer(async_mode="aiohttp", cors_allowed_origins='*')


async def index(request):
    content = open(os.path.join(ROOT, "test.html"), "r").read()
    return web.Response(content_type="text/html", text=content)

async def javascript(request):
    content = open(os.path.join(ROOT, "client.js"), "r").read()
    return web.Response(content_type="application/javascript", text=content)

@sio.event()
async def connect(sid, environ):
    await sio.emit('my_response', {'data': 'Connected', 'count': 0}, to=sid)

async def res(data):
    offer = RTCSessionDescription(sdp=data["offer"]["sdp"], type=data["offer"]["type"])
    pc = RTCPeerConnection()
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pcs.add(pc)
    #player = MediaPlayer(os.path.join(ROOT, "demo-instruct.wav"))
    player = MediaPlayer(os.path.join(ROOT, "chrome.mp4"),loop=True)
    recorder = MediaBlackhole()
    
    def log_info(msg, *args):
        logger.info(pc_id + " " + msg, *args)
    
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        log_info("Connection state is %s", pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    
    @pc.on("track")
    def on_track(track):
        log_info("Track %s received", track.kind)
        if track.kind == "audio":
            pc.addTrack(player.audio)
            recorder.addTrack(track)
        elif track.kind == "video":
            pc.addTrack(player.video)
            recorder.addTrack(track)
        

        @track.on("ended")
        async def on_ended():
            log_info("Track %s ended", track.kind)
            
            await recorder.stop()
           

    await pc.setRemoteDescription(offer) 
    await recorder.start() 
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)  
    await sio.emit("connect_to_server_response", {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

@sio.on("connect_to_server")
async def connect_to_server(sid, data):
    
    await res(data)
    
@sio.on("pause")
async def pause_video(sid, data):
    print(data) 

async def on_shutdown(app):
    pass

if __name__ == "__main__":
    load_dotenv()
    if os.getenv("ENVIRONMENT") == "development":
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    
    app = web.Application()
    sio.attach(app, socketio_path="stream")
    #app.on_shutdown(on_shutdown)
    app.router.add_get("/", index)
    app.router.add_get("/client.js", javascript)
    web.run_app(
        app, access_log=logger, host=os.getenv("HOST"), port=os.getenv("PORT")
    )
    