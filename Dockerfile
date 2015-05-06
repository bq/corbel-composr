FROM    devopsbq/base:1.0
# Author / Maintainer
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Copy app source
COPY . /src

# Install dev dependencies
RUN cd /src; npm install

# Expose port
EXPOSE  3000

# Enable corbel-composer
CMD cd /src; npm start