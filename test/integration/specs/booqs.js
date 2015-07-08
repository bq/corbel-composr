'use strict';
/**
 * only with qa environment
 */
var request = require('supertest'),
  chai = require('chai'),
  corbel = require('corbel-js'),
  expect = chai.expect,
  clientUtils = require('../utils/client'),

  clientToken,
  userToken,
  DOMAIN = 'booqs:demo',
  clientData = clientUtils.getDemoClient(),
  userData = clientUtils.getUser();

var CLIENT_ASSERTION = corbel.jwt.generate({
  'iss': clientData.clientId,
  'aud': corbel.Iam.AUD,
  'scope': clientData.scopes
}, clientData.clientSecret);

var USER_ASSERTION = corbel.jwt.generate({
  'iss': clientData.clientId,
  'aud': corbel.Iam.AUD,
  'scope': userData.scopes,
  'basic_auth.username': userData.username,
  'basic_auth.password': userData.password
}, clientData.clientSecret);

function test(app) {
  describe('In booqs:demo domain', function() {

    before(function(done) {

      this.timeout(5000);
      request(app)
        .post('/' + DOMAIN + '/loginclient')
        .send({
          jwt: CLIENT_ASSERTION
        })
        .expect(200)
        .end(function(err, response) {

          expect(response).to.be.an('object');
          expect(response.body.accessToken).to.exist;

          clientToken = response.body.accessToken;

          request(app)
            .post('/' + DOMAIN + '/loginuser')
            .send({
              jwt: USER_ASSERTION
            })
            .expect(200)
            .end(function(err, response) {

              expect(response).to.be.an('object');
              expect(response.body.tokenObject.accessToken).to.exist;

              userToken = response.body.tokenObject.accessToken;

              done(err);
            });

        });

    });

    it('/library phrase', function(done) {
      request(app)
        .get('/' + DOMAIN + '/library')
        .set('Authorization', userToken)
        .expect(200)
        .end(function(err, response) {

          expect(response.body).to.be.an('object');
          expect(response.body).to.include.keys('library');
          expect(response.body.library).to.be.an('array');
          expect(response.body.library[0]).to.include.keys(
            'id',
            'titleText',
            'publisherName',
            'languages',
            'publicationDate',
            'numberOfPages',
            'authors',
            'topics',
            'productIdentifier',
            'productFormDetail',
            'epubTechnicalProtection',
            'productSize',
            'coverImageUrl',
            'downloadUrl',
            'descriptionText',
            'owned'
          );
          done(err);
        });
    });

    it('/catalogue phrase', function(done) {
      request(app)
        .get('/' + DOMAIN + '/catalogue')
        .set('Authorization', userToken)
        .expect(200)
        .end(function(err, response) {

          expect(response.body).to.be.an('object');
          expect(response.body).to.include.keys(
            'page',
            'pageSize',
            'count',
            'catalog'
          );
          expect(response.body.catalog).to.be.an('array');
          expect(response.body.catalog[0]).to.include.keys(
            'id',
            'coverImageUrl',
            'titleText',
            'authors',
            'owned'
          );

          done(err);
        });
    });

    it('/book/:id phrase', function(done) {
      request(app)
        .get('/' + DOMAIN + '/catalogue')
        .set('Authorization', userToken)
        .expect(200)
        .end(function(err, response) {

          request(app)
            .get('/' + DOMAIN + '/book/' + response.body.catalog[0].id)
            .set('Authorization', userToken)
            .expect(200)
            .end(function(err, response) {

              expect(response.body).to.be.an('object');
              expect(response.body).to.include.keys(
                'id',
                'titleText',
                'publisherName',
                'languages',
                'publicationDate',
                'numberOfPages',
                'authors',
                'topics',
                'productIdentifier',
                'productFormDetail',
                'epubTechnicalProtection',
                'productSize',
                'coverImageUrl',
                'downloadUrl',
                'descriptionText',
                'owned'
              );

              done(err);
            });

        });

    });

    it('/categories/:id phrase', function(done) {
      var BOOKS_PER_CATEGORY = 3;
      request(app)
        .get('/' + DOMAIN + '/categories?booksPerCategory=' + BOOKS_PER_CATEGORY)
        .set('Authorization', userToken)
        .expect(200)
        .end(function(err, response) {

          expect(response.body).to.be.an('object');
          expect(response.body.categories).to.be.an('array');
          expect(response.body.categories[0]).to.include.keys(
            'id',
            'title',
            'count',
            'books'
          );
          expect(response.body.categories[0].id).to.be.an('string');
          expect(response.body.categories[0].title).to.be.an('string');
          expect(response.body.categories[0].count).to.be.an('number');
          expect(response.body.categories[0].books).to.be.an('array');
          expect(response.body.categories[0].books[0]).to.include.keys(
            'id',
            'titleText',
            'authors',
            'owned'
          );

          response.body.categories.forEach(function(category) {
            expect(category.books.length).to.be.at.most(BOOKS_PER_CATEGORY);
          });

          done(err);

        });

    });

    describe('/library/:bookId', function() {

      var availableBook;

      before(function(done) {

        request(app)
          .get('/' + DOMAIN + '/catalogue')
          .set('Authorization', userToken)
          .expect(200)
          .end(function(err, response) {

            availableBook = response.body.catalog[0];

            done(err);
          });

      });

      //it('with available book returns 200', function(done) {
//
        //var BOOKS_ID = availableBook.id;
        //request(app)
          //.post('/' + DOMAIN + '/library/' + BOOKS_ID)
          //.set('Authorization', userToken)
          //.expect(200)
          //.end(function(err, response) {
//
            //done(err);
//
          //});
//
      //});

      it('with not found book returns 404', function(done) {

        var BOOKS_ID = 'not_found_book';
        request(app)
          .post('/' + DOMAIN + '/library/' + BOOKS_ID)
          .set('Authorization', userToken)
          .expect(404)
          .end(function(err, response) {

            done(err);

          });

      });

    });

  });


}

module.exports = test;
