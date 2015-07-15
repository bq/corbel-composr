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

  var searchParams = buildSearchParams(assetsIds, params);

  console.log(JSON.stringify(searchParams, null, 2))
  countAllBooks()
    .then(function(amount) {
      result.count = amount;

      return corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
        .get(null, searchParams);
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

//Build the search params composed by various search queries, pagination and sort
function buildSearchParams(assetsIds, params) {

  var searchParams = {
    pagination: {
      page: params.page ? params.page : 0,
      size: params.pageSize ? params.pageSize : 10
    }
  };

  //Possible queries
  var queries = [];

  if (params.ftsearch) {
    var ftsearchQueryObject = createFtSearchQueries(params.ftsearch);
    queries = ftsearchQueryObject.queries;
  }

  if (params.query) {
    var customQuery = buildCustomQuery(assetsIds, params.query);
    if (customQuery) {
      queries.push(customQuery);
    }
  }

  if (params.sort) {
    var sortObject = parseSortParams(params.sort);

    if (sortObject) {
      searchParams.sort = sortObject;
    }
  }

  if (queries.length > 0) {
    searchParams.queries = queries;
  }

  return searchParams;
}

//Map ftsearch params to real names
function createFtSearchQueries(ftsearch) {

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


//Parse sort params
function parseSortParams(sortOptions) {
  var mappedValues = {
    'languages': 'language',
    'titleText': 'title',
    'publicationDate': 'publishingTime'
  };

  try {

    sortOptions = JSON.parse(sortOptions);
    if (sortOptions.field && mappedValues[sortOptions.field]) {

      var sortObject = {};

      var sortOrder = sortOptions.order ? sortOptions.order : 'ASC';

      sortObject[mappedValues[sortOptions.field]] = corbel.Resources.sort[sortOrder];

      return sortObject;
    } else {
      return null;
    }

  } catch (e) {
    console.log(e);
    return null;
  }
}

//Recreates the query object for the custom query parameters allowed in the phrase
////TODO: modify also the ftsearch query with the owned query
function buildCustomQuery(assetsIds, queryString) {
  var query = null;

  try {
    query = JSON.parse(queryString);
  } catch (e) {
    console.log(e);
    return null;
  }

  var ownedQuery = null;

  var mappedValues = {
    'languages': function(operator, field, value) {
      var obj = {};
      obj[operator] = {
        'language': value
      };
      return obj;
    },
    'titleText': function(operator, field, value) {
      var obj = {};
      obj[operator] = {
        'title': value
      };
      return obj;
    },
    'topics': function(operator, field, value) {
      var obj = {};
      obj[operator] = {
        'storeCategories': value
      };
      return obj;
    },
    'authors': function(operator, field, value) {
      var filter = {};
      filter[operator] = {
        'name': value
      };

      var obj = {
        '$elem_match': {
          'authors': []
        }
      };
      obj['$elem_match'].authors.push(filter);
      return obj;
    },
    'productFormDetail': function(operator, field, value) {
      var obj = {};
      obj[operator] = {
        'format': value
      };
      return obj;
    },
    'owned': function(operator, field, value) {
      //Owned is a calculated field, it should be requested diferently
      ownedQuery = {
        operator: operator,
        value: value
      };
    }
  };

  //Right now it only supports 1 level deep [{"$eq":{"meta:label":"The Killers"}}, {"$eq":{"meta:label":"The Killers"}}, {"$eq":{"meta:label":"The Killers"}}];
  var newQuery = _.compact(query.map(function(queryItem) {
    var operator = Object.keys(queryItem)[0];
    var field = Object.keys(queryItem[operator])[0];
    var value = queryItem[operator][field];

    var queryItem = mappedValues[field] ? mappedValues[field](operator, field, value) : null;
    if (queryItem) {
      return queryItem;
    }
  }));

  query = {
    query: newQuery
  };

  //Add owned filters if ownedQuery exists
  if (ownedQuery) {
    if (ownedQuery.value === true) {
      query.query.push({
        '$in': {
          '_dst_id': assetsIds
        }
      });
    } else {
      query.query.push({
        '$nin': {
          '_dst_id': assetsIds
        }
      });
    }
  }


  return query;
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