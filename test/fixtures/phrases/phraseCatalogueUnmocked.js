if (!req.get("Authorization")) {
  res.status(401).send(new ComposerError("error:authorization:undefined", "", 401));
  return
}

var loggedClientOrUserAccesToken = req.get('Authorization');


//Entry point, orchestates the main calls
function loadCatalogueBooks(params) {
  var dfd = q.defer();
  var accessTokenDecoded = corbel.jwt.decode(loggedClientOrUserAccesToken);
  var isUser = accessTokenDecoded.hasOwnProperty('userId');

  if (isUser) {
    getAllBooksAssets()
      .then(function(assets) {
        return loadBooks(assets, params);
      })
      .then(dfd.resolve)
      .catch(dfd.reject);
  } else {
    loadBooks([], params)
      .then(dfd.resolve)
      .catch(dfd.reject);
  }

  return dfd.promise;
}

/**
 * Recursivelly fetch all the items for a list
 * @param  {Function} caller     function that returns a promise with fetched items
 * @param  {List} items      List of items
 * @param  {Integer} pageNumber
 * @param  {Integer} pageSize
 * @param  {promise} promise
 * @return {List}
 */
var getAllRecursively = function(caller, items, pageNumber, pageSize, promise) {
  items = items || [];
  pageNumber = pageNumber || 0;
  pageSize = pageSize || 20;
  promise = promise || q.resolve();

  return promise.then(function() {

    return caller(pageNumber, pageSize).
    then(function(response) {
      if (response.data && response.status === 200) {
        items = items.concat(response.data);
        if (response.data.length < pageSize) {
          return items;
        } else {
          return getAllRecursively(caller, items, pageNumber + 1, pageSize, promise);
        }
      } else {
        throw new ComposerError('error:get:books', '', 500);
      }
    });
  });
};

/**
 * Return all the assets of the user that are associated to books
 */
function getAllBooksAssets() {

  var caller = function(pageNumber, pageSize) {
    return corbelDriver.assets().get({
      pagination: {
        page: pageNumber,
        size: pageSize
      },
      query: [{
        '$eq': {
          'name': 'Book views'
        }
      }]
    });
  };

  return getAllRecursively(caller);
}

/**
 * Counts all the books the client can access to.
 */
function countAllBooks() {
  var dfd = q.defer();

  corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
    .get(null, {
      aggregation: {
        $count: '*'
      }
    })
    .then(function(response) {
      console.log(response.data.count, 'books counted');
      dfd.resolve(response.data.count);
    })
    .catch(dfd.reject)

  return dfd.promise;
}

/**
 * Loads all the books and marks the owned by the user as owned
 */
function loadBooks(assets, params) {
  var dfd = q.defer();

  params.page = params.page ? params.page : 0;
  params.pageSize = params.pageSize ? params.pageSize : 10;


  var assetsIds = assets.map(function(asset) {
    return 'books:Book/' + asset.productId;
  });

  //The result returned
  var result = {
    page: params.page,
    pageSize: params.pageSize,
    count: null,
    catalog: null
  };

  var booksFound;
  countAllBooks()
    .then(function(amount) {
      result.count = amount;

      return corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
        .get(null, {
          pagination: {
            page: params.page,
            size: params.pageSize
          }
        });
    })
    .then(function(response) {
      var books = response.data.map(function(book) {
        return (new BookModel(book, assetsIds)).toSmall();
      });

      result.catalog = books;

      dfd.resolve(result);
    })
    .catch(function(err) {
      dfd.reject(err);
    });

  return dfd.promise;
}


var BookModel = function(opts, assetsIds) {
  this.id = opts.id.replace('books:Book/', '');

  //titletext
  this.titleText = opts.title;

  //publisherName
  this.publisherName = opts.publisherGroupName;

  //languages
  this.languages = [opts.language];

  //publicationDate
  this.publicationDate = opts.publishingTime ? (new Date(opts.publishingTime)).toISOString() : null;

  //Number of pages TODO
  this.numberOfPages = 0;

  //authors
  this.authors = opts.authors.map(function(author) {
    return author.name;
  });

  //Topics 
  this.topics = opts.storeCategories ? opts.storeCategories : [];


  //productIdentifier
  this.productIdentifier = [{
    "ProductIDType": "ISBN",
    "IDValue": opts.isbn
  }];

  //Product form detail
  this.productFormDetail = [opts.format];


  //epubTechnicalProtection TODO
  this.epubTechnicalProtection = null;

  //productSize
  this.productSize = opts.size;

  //coverImageUrl
  this.coverImageUrl = 'https://resources-qa.bqws.io/v1.0/resource/books:Book/' + opts.id;

  //downloadUrl
  this.downloadUrl = 'https://resources-qa.bqws.io/v1.0/resource/books:Book/' + opts.id;

  //descriptionText
  this.descriptionText = opts.synopsis;

  //Owned by the user
  this.owned = assetsIds.reduce(function(prev, next) {
    return prev || next === opts.id;
  }, false);

}

BookModel.prototype.toSmall = function() {
  return _.pick(this, 'id', 'coverImageUrl', 'titleText', 'authors', 'owned');
}

loadCatalogueBooks(req.query)
  .then(function(result) {
    res.send(result);
  })
  .catch(function(err) {
    compoSR.run('global:parseError', {
      err: err,
      res: res
    });
  });