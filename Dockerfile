FROM    devopsbq/base:1.2
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Select Node Version
ENV NODE_VERSION stable
RUN nave usemain $NODE_VERSION

# Install dev dependencies
RUN cd /src; npm install

# Expose port
EXPOSE  3000

# Enable corbel-composer
CMD cd /src; npm start && npm run logs
