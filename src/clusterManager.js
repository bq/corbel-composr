
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var count = 0;

function initializeClusters(app, debug){
  if (cluster.isMaster) {

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
     cluster.fork();
    }

    cluster.on('disconnect', function(worker) {
      //console.error('disconnect!');
      cluster.fork();
    });

    cluster.on('exit', function(worker, code, signal) {
      //console.log('worker ' + worker.process.pid + ' died');
    });

  } else {


    var domain = require('domain');

    // See the cluster documentation for more details about using
    // worker processes to serve requests.  How it works, caveats, etc.
    var createDomain = require('domain').create

    var domainMiddleware = function(req, res, next) {
      var domain = createDomain();
      domain.id = domainMiddleware.id(req);
      domain.add(req);
      domain.add(res);
      domain.run(function() {
        next();
      });
      domain.on('error', function(e) {
        console.log('error', e.stack);
        next(e);

        //app.close();
        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        //cluster.worker.disconnect();
      });
    };

    //you can replace this method to
    //supply your own id builder
    domainMiddleware.id = function(req) {
      return new Date().getTime() + (count++);
    };

    app.use(domainMiddleware);

    var server = app.listen(app.get('port'), function() {
      debug('Express server listening on port ' + server.address().port);
    });
  }

}

module.exports = initializeClusters
