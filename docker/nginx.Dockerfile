FROM nginx
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY gateway/nginx/nginx.conf /etc/nginx/nginx.conf
COPY gateway/nginx/* /etc/nginx/conf.d/
COPY gateway/example.crt /etc/ssl/
COPY gateway/example.key /etc/ssl/
RUN rm -rf /etc/nginx/conf.d/nginx.conf