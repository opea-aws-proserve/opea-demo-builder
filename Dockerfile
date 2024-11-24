FROM node:latest
WORKDIR /app
EXPOSE 80
EXPOSE 443

COPY . .
RUN npm install
RUN npm run build
RUN chmod +x ./lib/app/bin/marketplace.sh
CMD ["./lib/app/bin/marketplace.sh"]
