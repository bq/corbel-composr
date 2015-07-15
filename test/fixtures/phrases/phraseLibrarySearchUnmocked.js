if (!req.get("Authorization")) {
  res.status(401).send(new ComposerError("error:authorization:undefined", "", 401));
  return
}

if(!req.query.booksPerSection){
  res.status(400).send(new ComposerError("error:booksPerSection:missing", "", 400));
}

if(!req.query.ftsearch){
  res.status(400).send(new ComposerError("error:ftsearch:missing", "", 400));
}

var loggedClientOrUserAccesToken = req.get('Authorization');


//Map ftsearch params to real names
function createQueryObject(ftsearch) {

  var mappedValues = {
    'titleText': function(value) {
      var query = {
        query: [{
          '$like': {
            'title': value
          }
        }]
      };
      return query;
    },
    'authors': function(value) {
      var filter = {
        '$like': {
          'name': value
        }
      };

      var query = {
        query: [{
          '$elem_match': {
            'authors': [filter]
          }
        }]
      };
      return query;
    }
  };

  var queryTitle = mappedValues.titleText(ftsearch);
  var queryAuthors = mappedValues.authors(ftsearch);
  var apiSearch = {
    text: ftsearch
  };

  return {
    queries: [queryTitle, queryAuthors],
    search: apiSearch
  }
}

//Entry point, orchestates the main calls
function searchLibraryBooks(params) {
  var dfd = q.defer();
  var accessTokenDecoded = corbel.jwt.decode(loggedClientOrUserAccesToken);
  var isUser = accessTokenDecoded.hasOwnProperty('userId');

  if (params.ftsearch) {
    params.queryObject = createQueryObject(params.ftsearch);
  }

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
 * Loads all the books that match some assetsIds and certain queries
 * TODO : Use queries and ftsearch instead of query
 */
function getUserBooks(assetsIds, params) {
  var dfd = q.defer();

  var userQueries = params.queryObject.queries.map(function(queryItem) {
    var newItem = _.cloneDeep(queryItem);

    newItem.query.push({
      '$in': {
        '_dst_id': assetsIds
      }
    });
    return newItem;
  })


  var requestParams = {
    queries: userQueries,
    //query: userQueries[0].query,
    pagination: {
      page: 0,
      size: params.booksPerSection
    }
  };

  var caller = function() {
    return corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
      .get(null, requestParams);
  }

  getAllRecursively(caller)
    .then(function(booksFetched) {

      var books = booksFetched.map(function(book) {
        return (new BookModel(book, assetsIds)).toSmall();
      });

      dfd.resolve(books);
    })
    .catch(dfd.reject);

  return dfd.promise;
}

/**
 * Gets the catalogue books
 * TODO: Use queries and ftsearch
 */
function getCatalogueBooks(assetsIds, searchParamsCatalogue) {
  var dfd = q.defer();

  searchParamsCatalogue.queries = searchParamsCatalogue.queries.map(function(queryItem) {
    var newItem = _.cloneDeep(queryItem);

    newItem.query.push({
      '$nin': {
        '_dst_id': assetsIds
      }
    });
    return newItem;
  });

  //searchParamsCatalogue.query = searchParamsCatalogue.queries[0].query;

  corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
    .get(null, searchParamsCatalogue)
    .then(function(response) {
      var books = response.data.map(function(book) {
        return (new BookModel(book, assetsIds)).toSmall();
      })

      dfd.resolve(books);
    })
    .catch(dfd.reject);

  return dfd.promise;
}

/**
 * Loads all the books and marks the owned by the user as owned
 */
function loadBooks(assets, params) {
  var dfd = q.defer();

  params.booksPerSection = params.booksPerSection ? params.booksPerSection : 5;

  var assetsIds = assets.map(function(asset) {
    return 'books:Book/' + asset.productId;
  });

  //The result returned
  var result = {
    ownedBooks: null,
    catalogueBooks: null
  };

  getUserBooks(assetsIds, params)
    .then(function(ownedBooks) {
      result.ownedBooks = ownedBooks;

      var searchParamsCatalogue = {
        pagination: {
          page: 0,
          size: params.booksPerSection
        },
        queries: params.queryObject.queries
        //search : params.queryObject.search
      };

      return getCatalogueBooks(assetsIds, searchParamsCatalogue);
    })
    .then(function(catalogueBooks) {
      result.catalogueBooks = catalogueBooks;
      dfd.resolve(result);
    })
    .catch(function(err) {
      console.log('error', err);
      dfd.reject(err);
    });

  return dfd.promise;
}


var urlBase = corbelDriver.config.get('urlBase').replace('{{module}}', corbel.Resources.moduleName);


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
  this.coverImageUrl = urlBase + 'resource/' + opts.id;

  //downloadUrl
  this.downloadUrl = urlBase + 'resource/' + opts.id;

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

searchLibraryBooks(req.query)
  .then(function(result) {
    res.send(result);
  })
  .catch(function(err) {
    compoSR.run('global:parseError', {
      err: err,
      res: res
    });
  });