FROM node:4.2.1
# Author / Maintainer
MAINTAINER Composr Team <support-composr@bq.com >

WORKDIR /src

# Copy app source
COPY . /src

# Install packages
RUN apt-get update && \
 apt-get install -y net-tools && \
 apt-get clean && \
 rm -rf /var/lib/apt/lists/*

# Install dev dependencies
RUN npm install; npm rebuild; npm install -g bunyan

ENV PATH node_modules/pm2/bin:$PATH

# Global config environment variable

ENV URL_BASE ''
ENV RABBITMQ_HOST ''
ENV RABBITMQ_PASSWORD ''
ENV RABBITMQ_FORCE_CONNECT true
ENV CREDENTIALS_CLIENT_ID ''
ENV CREDENTIALS_CLIENT_SECRET ''
ENV CREDENTIALS_SCOPES ''
ENV LOG_LEVEL debug
ENV LOG_FILE logs/composr.log
ENV RABBITMQ_PORT ''
ENV RABBITMQ_USERNAME ''
ENV ACCESS_LOG true
ENV NRACTIVE false
ENV NRAPPNAME ''
ENV NRAPIKEY ''
ENV NODE_ENV production
ENV BUNYAN_LOG true
ENV PORT 3000
ENV RABBITMQ_FORCE_CONNECT true

# Expose port
EXPOSE $PORT

# Enable corbel-composr
CMD npm start
