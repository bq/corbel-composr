FROM    ubuntu
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Update repository
RUN apt-get update

# Install dependencies
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup | sudo bash -

# Install nodejs
RUN apt-get -y install nodejs git git-core

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install

# Expose port
EXPOSE  3000

# Enable corbel-composer
CMD cd /src; npm start; ./node_modules/pm2/bin/pm2 logs
