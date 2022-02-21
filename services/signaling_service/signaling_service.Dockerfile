FROM python:3.8-slim-buster
COPY services/signaling_service/requirements.txt /home/app/services/signaling_service/requirements.txt
WORKDIR /home/app/services/signaling_service
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip3 install python-socketio
RUN pip3 install python-dotenv
RUN pip3 install aiohttp
RUN pip3 install aiortc
COPY services/signaling_service/ /home/app/services/signaling_service/

CMD ["python3", "main.py"]
EXPOSE 50000