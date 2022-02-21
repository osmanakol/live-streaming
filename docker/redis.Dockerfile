FROM redis
COPY docker/redis/redis.conf /etc/redis/redis.conf
RUN redis-server /etc/redis/redis.conf