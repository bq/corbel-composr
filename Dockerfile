FROM node:0.12.3
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install; npm rebuild

# Any text editor
RUN apt-get install -y nano

# Expose port
EXPOSE  3000

#Set the endpoint suffix for the environment to use
ENV ENDPOINT_SUFFIX "-qa"

# Enable corbel-composer
CMD E=0; \
    while [ "$E" != 401 ]; \
    do E=`curl -s -o /dev/null -w "%{http_code}" https://iam$ENDPOINT_SUFFIX.bqws.io`; \
    echo $E ; \
    sleep 5 ; \
    done ; \ 
    cd /src && npm start && npm run logs
