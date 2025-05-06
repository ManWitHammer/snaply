FROM node

WORKDIR /server

COPY . .

RUN npm i

RUN npm run build

CMD ["node", "dist/index.js"]
EXPOSE 3000