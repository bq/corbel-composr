FROM    centos:centos6
MAINTAINER Silkroad Team <support-silkroad@bq.com>

# Enable EPEL for Node.js
RUN  rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# Install Node.js and npm:
RUN yum install -y npm

# Copy source code inside the Docker image:
COPY . /src

# Apps bind port: 
EXPOSE 3000

# Enable corbel-composer
CMD cd /src; npm start
