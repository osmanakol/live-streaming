FROM node:14
ENV HOME=/home/app
COPY package*.json tsconfig.json $HOME/api/
WORKDIR $HOME
RUN npm install
COPY . $HOME
RUN npm run build
CMD ["npm", "run", "prod"]
EXPOSE 30000