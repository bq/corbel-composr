FROM node:0.12.3
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install; npm rebuild

#pm2 for utilities
RUN npm install -g pm2

#update packages
RUN apt-get update

# Any text editor
RUN apt-get install -y nano net-tools

# For allowing nano
ENV TERM xterm

# Expose port
EXPOSE  3000

# Global config environment variable

ENV COMPOSR_CONFIG ''
ENV URL_BASE ''
ENV RABBITMQ_HOST ''
ENV RABBITMQ_PASSWORD ''
ENV CLIENT_ID ''
ENV CLIENT_SECRET ''
ENV CREDENTIALS_SCOPES ''
ENV LOG_LEVEL debug
ENV LOG_FILE logs/composr.log
ENV RABBITMQ_PORT 8200
ENV RABBITMQ_USERNAME ''
ENV RABBITMQ_EVENT ''


#Set the endpoint suffix for the environment to use
ENV ENDPOINT_SUFFIX -qa

# Enable corbel-composer
CMD STATUS=0; \
    while [ "$STATUS" != 200 ]; \
    do STATUS=`curl -s -o /dev/null -w "%{http_code}" https://iam$ENDPOINT_SUFFIX.bqws.io/version`; \
    echo $STATUS on https://iam$ENDPOINT_SUFFIX.bqws.io/version; \
    sleep 5 ; \
    done ; \
    cd /src && npm start && npm run logs
