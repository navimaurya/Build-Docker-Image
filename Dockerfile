FROM node
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
USER node
RUN npm install && npm run build
EXPOSE 3000
CMD [ "node", "dist/index.js" ]
