var ramlParser = require('raml-parser');
var ramlHtml = require('raml2html');
var inquirer = require('inquirer');
var fs = require('fs');
var path = require('path');
var defaultRamlPath = path.join(path.dirname(__filename), '../test/fixtures/api/pirate.raml');

var ramlUtils = function () {
  inquirer.prompt([
    {
      type: 'input',
      name: 'file',
      message: 'Enter the path to the raml file. Leave blank for the default: ' + defaultRamlPath
    },
    {
      type: 'list',
      name: 'operation',
      message: 'Choose the operation',
      choices: ['raml2json', 'raml2phrases', 'raml2html', 'raml2json2base64'],
      default: 'raml2phrases'
    }], function (answers) {

    var file = answers['file'] ? answers['file'] : defaultRamlPath

    switch (answers['operation']) {
      case 'raml2json':
        raml2json(file).then(function (data) {
          console.log(JSON.stringify(data, null, 2));
        }).catch(function (err) {
          console.log(err);
        });
        break;
      case 'raml2phrases':
        raml2phrases(file).then(function (data) {
          console.log(JSON.stringify(data, null, 2));
        }).catch(function (err) {
          console.log(err);
        });
        break;
      case 'raml2html':
        raml2html(file).then(function (data) {
          fs.writeFile("raml.html", data, function (err) {
            if (err) {
              throw err;
            }
            console.log("File saved: raml.html");
          });
        }).catch(function (err) {
          console.log(err);
        });
        break;
      case 'raml2json2base64':
        raml2json2base64(file).then(function (data) {
          console.log(JSON.stringify(data, null, 2));
        }).catch(function (err) {
          console.log(err);
        });
        break;
    }
  });

}

var raml2json = function (file) {
  return ramlParser.loadFile(file)
}

var raml2html = function (file) {
  return ramlHtml.render(file, ramlHtml.getDefaultConfig())
}

var raml2phrases = function (file) {
  return raml2json(file).then(function (data) {
    var phrases = [];
    try {
      searchPhrasesOnResource(phrases, data.resources, '');
      return Promise.resolve(phrases);
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  })
}

var raml2json2base64 = function (file) {
  return raml2json(file).then(JSON.stringify).then(encodeToBase64);
}

searchPhrasesOnResource = function (phrases, resources, accumulatedPath) {
  if (!resources) {
    return phrases;
  }

  resources.forEach(function (resource) {
    var path = accumulatedPath + resource.relativeUri;

    if (resource.methods) {
      var phrase = {};
      phrase.url = path;
      phrase.id = 'seven:seas!pirates!v0' + path.replace('/', '!').replace('{', ':').replace('}', '');
      phrase.md5 = 'AAAAAAA';

      resource.methods.forEach(function (method) {
        phrase[method.method] = {}
        var dummyCode = 'res.status(200).send({\'Ahoy!\'});'
        phrase[method.method].code = encodeToBase64(dummyCode);
        phrase[method.method].middlewares = ['validate'];
      });

      phrases.push(phrase);
    }

    searchPhrasesOnResource(phrases, resource.resources, path);
  });

  return phrases;
}

var phrase2raml = function(phrase) {
  var doc = {};

  // convert express URL `path/:param1/:param2` to
  // RAML URL`path/{param1}/{param2}`
  var url = phrase.url ? phrase.url.split('/') : [];
  url = url.map(function(item) {
    if (item[0] === ':') {
      item = item.replace(':', '{').replace('?', '');
      item += '}';
    }
    return item;
  }).join('/');

  url = '/' + url;
  doc[url] = {};

  // model version
  doc[url].description = 'release ' + phrase.version;

  ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
    if (phrase[method]) {
      doc[url][method] = phrase[method].doc;

      // oauth_2_0 has specific type for common header documentation
      if (phrase[method].doc && phrase[method].doc.securedBy && phrase[method].doc.securedBy.indexOf('oauth_2_0') !== -1) {
        doc[url].type = 'secured';
      }
    }
  });

  return doc;
};

function encodeToBase64(string) {
  return new Buffer(string).toString('base64');
}

module.exports.raml2json = ramlUtils();