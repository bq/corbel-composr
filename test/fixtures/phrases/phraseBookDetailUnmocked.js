if (!req.get("Authorization")) {
  res.status(401).send(new ComposerError("error:authorization:undefined", "", 401));
  return
}

if(!req.params.id){
    res.send({
       status: 400,
       description: 'Parameters are invalids'
  });
}

//Get the books with the categories
function loadBookDetail(params) {
  var dfd = q.defer();
  getBookAsset(params.id)
    .then(function(asset) {
      return loadBook(params.id, asset);
    })
    .then(dfd.resolve)
    .catch(dfd.reject);

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
 * Return an asset (if exists) for the book
 */
function getBookAsset(bookId) {
  var dfd = q.defer();

  corbelDriver.assets().get({
    query: [{
      '$eq': {
        'name': 'Book views'
      },
      '$eq': {
        'productId': bookId
      }
    }]
  })
    .then(function(response) {
      dfd.resolve(response.data);
    })
    .catch(dfd.reject)

  return dfd.promise;
}


/**
 * Load a book and associate the categories to it
 */
function loadBook(bookId, assets) {
  var dfd = q.defer();

  var book;

  var assetsIds = assets.map(function(asset) {
    return 'books:Book/' + asset.productId;
  });


  corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
    .get(bookId)
    .then(function(response) {
      book = new BookModel(response.data, assetsIds);
      return fetchCategories(book.topics);
    })
    .then(function(categories) {
      book.topics = book.topics.map(function(topicId) {
        return {
          id: topicId,
          name: categories[topicId].name
        }
      });

      dfd.resolve(book);
    })
    .catch(dfd.reject);

  return dfd.promise;
}

/**
 * Fetches all the categories associated to a list of categories ids
 */
function fetchCategories(ids) {
  var dfd = q.defer();

  var caller = function(pageNumber, pageSize) {
    return corbelDriver.resources
      .collection('books:Category')
      .get({
        pagination: {
          page: pageNumber,
          size: pageSize
        },
        query: [{
          '$in': {
            'id': ids
          }
        }]
      });
  }

  getAllRecursively(caller)
    .then(function(categories) {
      var result = {};
      categories.forEach(function(category) {
        result[category.id] = category;
      });

      dfd.resolve(result);
    })
    .catch(dfd.reject);
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

/**
 * Triggers the execution
 */
loadBookDetail({
  id : req.params.id
})
  .then(function(book) {
    res.send(book);
  })
  .catch(function(err) {
    compoSR.run('global:parseError', {
      err: err,
      res: res
    });
  });