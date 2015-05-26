FROM node:0.12.3
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install; npm rebuild

# Expose port
EXPOSE  3000

#Set delay to 30 in order to wait until resources is up, set -e="DELAY=0" to avoid delay
ENV DELAY 30

# Enable corbel-composer
CMD sleep $DELAY; cd /src; npm start && npm run logs
