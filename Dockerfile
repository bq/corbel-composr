FROM node:4.2.1
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install; npm rebuild

#pm2 for utilities
RUN npm install -g pm2 standard

#update packages
RUN apt-get update

# Any text editor
RUN apt-get install -y nano net-tools

# Extra tools
RUN npm install -g bunyan

# For allowing nano
ENV TERM xterm

# Expose port
EXPOSE  3000

# Global config environment variable

ENV URL_BASE ''
ENV RABBITMQ_HOST ''
ENV RABBITMQ_PASSWORD ''
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

# Enable corbel-composr
CMD cd /src && NODE_ENV=production npm start && npm run logs
