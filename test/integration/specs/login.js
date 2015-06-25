'use strict';

var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../utils/client'),
  corbel = require('corbel-js');

function generateAssertion(claims, clientSecret) {
  claims.aud = corbel.Iam.AUD;
  return corbel.jwt.generate(claims, clientSecret);
}

function test(app) {

  /**
   * @param  {object} credentials
   * @param  {string} credentials.clientIdl
   * @param  {string} credentials.clientSecret
   * @param  {string} credentials.scopes
   * @return {Promise}
   */
  function getToken(credentials) {
    return new Promise(function(resolve, reject) {

      request(app)
        .post('/token')
        .send(credentials)
        .expect(200)
        .end(function(err, response) {

          expect(response).to.be.an('object');
          expect(response.body).to.be.an('object');
          expect(response.body.data).to.be.an('object');
          expect(response.body.data.accessToken).to.be.a('string');

          if (err) {
            reject(err);
          } else {
            resolve(response.body.data);
          }
        });

    });
  }

  /**
   * @param  {object} phrase
   * @param  {string} accessToken
   * @return {Promise}
   */
  function createPhrase(phrase, accessToken) {
    return new Promise(function(resolve, reject) {

      request(app)
        .put('/phrase')
        .set('Authorization', accessToken)
        .send(phrase)
        .expect(204)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.headers).to.be.an('object');
          expect(response.headers.location).to.be.a('string');

          if (err) {
            reject(err);
            return;
          }
          //let's wait till corbel triggers the event to register the phrase in composr
          //TODO: use any tool to know when it happens
          setTimeout(function() {
            resolve(response.headers.location);
          }, 4000);
        });

    });
  }

  /**
   * @param  {object} params
   * @param  {string} params.url
   * @param  {string} [params.method='post']
   * @param  {number} [params.responseStatus=200]
   * @param  {Mixed} [params.data]
   * @return {Promise}
   */
  function callPhrase(params) {
    params = params || {};
    params.method = params.method || 'post';
    params.responseStatus = params.responseStatus || 200;

    return new Promise(function(resolve, reject) {

      var phraseRequest = request(app)[params.method](params.url);

      if(params.headers){
        Object.keys(params.headers).forEach(function(key){
          phraseRequest.set(key, params.headers[key]);
        });
      }

      phraseRequest
        .send(params.data)
        .expect(params.responseStatus)
        .end(function(err, response) {
          if (err) {
            reject(err);
            return;
          }

          resolve(response);

        });

    });
  }

  /**
   * @param  {string} loginClientURL
   * @return {Promise}
   */
  function loginClient(loginClientURL) {

    var credentials = clientUtils.getDemoClient();

    return callPhraseWithJWT({
      url: loginClientURL,
      claims: {
        iss: credentials.clientId,
        scope: credentials.scopes
      },
      clientSecret: credentials.clientSecret
    });

  }

  /**
   * @param  {string} loginClientURL
   * @return {Promise}
   */
  function loginFakeClient(loginClientURL) {

    var credentials = clientUtils.getDemoClient();

    return callPhraseWithJWT({
      url: loginClientURL,
      claims: {
        iss: 'notGood',
        scope: credentials.scopes
      },
      clientSecret: credentials.clientSecret
    }, {
      responseStatus : 401
    });

  }

  /**
   * @param  {string} loginUserURL
   * @return {Promise}
   */
  function loginUser(loginUserURL) {

    var credentialsUser = clientUtils.getUser();
    var credentialsClient = clientUtils.getDemoClient();

    return callPhraseWithJWT({
      url: loginUserURL,
      claims: {
        iss: credentialsClient.clientId,
        exp : (Date.now() + 3500) / 1000,
        'basic_auth.username': credentialsUser.username,
        'basic_auth.password': credentialsUser.password,
        scope: credentialsUser.scopes
      },
      clientSecret: credentialsClient.clientSecret
    });

  }

  /**
   * @param  {string} loginUserURL
   * @return {Promise}
   */
  function loginFakeUser(loginUserURL) {
    var credentialsUser = clientUtils.getUser();
    var credentialsClient = clientUtils.getDemoClient();

    return callPhraseWithJWT({
      url: loginUserURL,
      claims: {
        iss: credentialsClient.clientId,
        'basic_auth.username': 'asdasdasd',
        'basic_auth.password': credentialsUser.password,
        scope: credentialsUser.scopes
      },
      clientSecret: credentialsClient.clientSecret
    }, {
      responseStatus : 401
    });
  }

  /**
   * @param  {string} logoutUserURL
   * @return {Promise}
   */
  function logoutUser(logoutUserURL, accessToken, responseStatus) {

    var credentialsUser = clientUtils.getUser();
    var credentialsClient = clientUtils.getDemoClient();

    return callPhrase({
      url: logoutUserURL,
      responseStatus : responseStatus,
      headers : {
        'Authorization' : accessToken
      }
    });

  }

  /**
   * @param  {string} refreshTokenURL
   * @param  {string} token
   * @return {Promise}
   */
  function refreshToken(refreshTokenURL, token, status) {
    status = status ? status : 200;
    var credentialsUser = clientUtils.getUser();
    var credentialsClient = clientUtils.getDemoClient();
    var claims = {
        iss: credentialsClient.clientId,
        'refresh_token': token,
        scope: credentialsUser.scopes,
        exp : (Date.now() + 3500 )/ 1000
      };

    return callPhraseWithJWT({
      url: refreshTokenURL,
      claims: claims,
      clientSecret: credentialsClient.clientSecret
    }, {
      responseStatus : status
    });

  }

  /**
   * @param  {object} params
   * @param  {string} params.url
   * @param  {string} params.clientSecret
   * @param  {object} params.claims
   * @param  {object} params.claims.iss
   * @param  {object} params.claims.scope
   * @param  {object} [params.claims.refresh_token]
   * @param  {object} [params.claims.basic_auth.username]
   * @param  {object} [params.claims.basic_auth.password]
   * @return {Promise}
   */
  function callPhraseWithJWT(params, phraseParams) {
    phraseParams = phraseParams ? phraseParams : {};
    phraseParams.url = params.url;

    phraseParams.data = phraseParams.data ? phraseParams.data : {};
    phraseParams.data.jwt = generateAssertion(params.claims, params.clientSecret);

    return callPhrase(phraseParams);

  }

  var AdminClientData = clientUtils.getAdminClient();
  var demoAppClientData = clientUtils.getDemoClient();

  var adminClientToken,
    demoClientToken;

  describe('With Login phrases,', function() {

    this.timeout(30000);

    before(function(done) {

      var clientPromise = getToken(demoAppClientData);
      var AdminPromise = getToken(AdminClientData);

      Promise.all([clientPromise, AdminPromise])
        .then(function(response) {
          demoClientToken = response[0].accessToken;
          adminClientToken = response[1].accessToken;
          done();
        }).catch(function(err) {
          done(err);
        });

    });

    describe('client login phrase', function() {

      var loginphrase = require('../../fixtures/phrases/phraseLoginClient.json');
      var phraseClientLoginLocation = 'phrase/apps-sandbox/loginclient';

      /*before('is created correctly', function(done) {
        createPhrase(loginphrase, adminClientToken)
          .then(function(location) {
            phraseClientLoginLocation = location;
            done();
          }).catch(function(err) {
            done(err);
          });

      });*/

      it('receives a token after calling it', function(done) {
        var url = phraseClientLoginLocation.replace('phrase/', '/').replace('!', '/');

        loginClient(url)
          .then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body.accessToken).to.be.a('string');
            done();
          })
          .catch(function(err) {
            done(err);
          });

      });

      it('receives a 401 with bad credentials', function(done) {
        var url = phraseClientLoginLocation.replace('phrase/', '/').replace('!', '/');

        loginFakeClient(url)
          .then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body.errorDescription).to.be.a('string');
            done();
          })
          .catch(function(err) {
            done(err);
          });

      });

    });

    describe('user login phrase', function() {

      var phraseUserLoginLocation,
        phraseUserLoginURL,
        userLoginPhrase = require('../../fixtures/phrases/phraseLoginUser.json');

        phraseUserLoginURL = '/apps-sandbox/loginuser';
      /*before('is created correctly', function(done) {
        createPhrase(userLoginPhrase, adminClientToken)
          .then(function(location) {
            phraseUserLoginLocation = location;
            phraseUserLoginURL = phraseUserLoginLocation.replace('phrase/', '/').replace('!', '/');
            done();
          }).catch(function(err) {
            done(err);
          });
      });*/

      it('receives a token/expires/refresh after calling it', function(done) {

        loginUser(phraseUserLoginURL)
          .then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(response.body.tokenObject).to.be.an('object');
            expect(response.body.tokenObject.accessToken).to.be.a('string');
            done();
          })
          .catch(function(err) {
            done(err);
          });

      });

      it('receives a 401 with bad user credentials', function(done) {

        loginFakeUser(phraseUserLoginURL)
          .then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(response.body.errorDescription).to.be.a('string');
            done();
          })
          .catch(function(err) {
            done(err);
          });

      });

      describe('with accessToken, user tokenRefresh phrase', function() {

        var refreshTokenLocation,
          demoUserToken,
          demoUserRefreshToken,
          secondUserRefreshToken,
          refreshTokenPhrase = require('../../fixtures/phrases/refreshToken.json');

        before('is created correctly', function(done) {

          /*createPhrase(refreshTokenPhrase, adminClientToken)
            .then(function(location) {
              refreshTokenLocation = location;
            })
            .then(function() {
              return loginUser(phraseUserLoginURL);
            })
            .then(function(response) {
              demoUserToken = response.body.tokenObject.accessToken;
              demoUserRefreshToken = response.body.tokenObject.refreshToken;
              done();
            })
            .catch(function(err) {
              done(err);
            });*/
            refreshTokenLocation = 'phrase/apps-sandbox/refreshtoken';

            loginUser(phraseUserLoginURL)
              .then(function(response) {
                demoUserToken = response.body.tokenObject.accessToken;
                demoUserRefreshToken = response.body.tokenObject.refreshToken;
                done();
              })
              .catch(function(err) {
                done(err);
              });
        });

        it('can refresh user token with refreshToken', function(done) {
          var url = refreshTokenLocation.replace('phrase/', '/').replace('!', '/');

          refreshToken(url, demoUserRefreshToken).then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(response.body.accessToken).to.be.a('string');
            expect(response.body.expiresAt).to.be.a('number');
            expect(response.body.refreshToken).to.be.a('string');
            expect(response.body.refreshToken).to.not.be.equal(demoUserRefreshToken);
            done();
          }).catch(function(err) {
            done(err);
          });

        });
        it('cant refresh user token with invalid refreshToken', function(done) {
          var url = refreshTokenLocation.replace('phrase/', '/').replace('!', '/');

          refreshToken(url, 'demoUserRefreshToken', 401).then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(response.body.error).to.be.a('string');
            done();
          }).catch(function(err) {
            done(err);
          });

        });

        it('cant refresh user token without refreshToken', function(done) {
          var url = refreshTokenLocation.replace('phrase/', '/').replace('!', '/');

          refreshToken(url, '', 401).then(function(response) {
            expect(response).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(response.body.error).to.be.a('string');
            done();
          }).catch(function(err) {
            done(err);
          });

        });

      });

      describe('User logout', function() {

        var phraseUserLogoutLocation,
          phraseUserLogoutURL,
          demoUserToken,
          userLogoutPhrase = require('../../fixtures/phrases/phraseLogoutUser.json');

        before('is created correctly', function(done) {
          /*createPhrase(userLogoutPhrase, adminClientToken)
            .then(function(location) {
              phraseUserLogoutLocation = location;
              phraseUserLogoutURL = phraseUserLogoutLocation.replace('phrase/', '/').replace(/!/g, '/');
              return loginUser(phraseUserLoginURL);
            })
            .then(function(response) {
              demoUserToken = response.body.tokenObject.accessToken;
              done();
            })
            .catch(function(err) {
              done(err);
            });*/
          phraseUserLogoutURL = '/apps-sandbox/logoutuser/:type?';

          loginUser(phraseUserLoginURL)
            .then(function(response) {
              demoUserToken = response.body.tokenObject.accessToken;
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });

        it('logs out a user', function(done) {

          logoutUser(phraseUserLogoutURL.replace(':type?', ''), demoUserToken)
            .then(function(response) {
              expect(response).to.be.an('object');
              expect(response.body).to.be.an('object');
              done();
            })
            .catch(function(err) {
              done(err);
            });

        });

        it('does not log out a user other time', function(done) {

          logoutUser(phraseUserLogoutURL.replace(':type?', ''), demoUserToken, 401)
            .then(function(response) {
              expect(response).to.be.an('object');
              expect(response.body).to.be.an('object');
              done();
            })
            .catch(function(err) {
              done(err);
            });

        });


        describe('User logout from all devices', function(){
          before('logs the user', function(done) {
            loginUser(phraseUserLoginURL)
              .then(function(response) {
                demoUserToken = response.body.tokenObject.accessToken;
                done();
              })
              .catch(function(err) {
                done(err);
              });
          });

          it('logs out a user', function(done) {

            logoutUser(phraseUserLogoutURL.replace(':type?', 'all'), demoUserToken)
              .then(function(response) {
                expect(response).to.be.an('object');
                expect(response.body).to.be.an('object');
                done();
              })
              .catch(function(err) {
                done(err);
              });

          });

          it('does not log out a user other time', function(done) {

            logoutUser(phraseUserLogoutURL.replace(':type?', 'all'), demoUserToken, 401)
              .then(function(response) {
                expect(response).to.be.an('object');
                expect(response.body).to.be.an('object');
                done();
              })
              .catch(function(err) {
                done(err);
              });

          });

        });


      });

    });

  });

}

module.exports = test;
