if (!req.get("Authorization")) {
  res.status(401).send(new ComposerError("error:authorization:undefined", "", 401));
  return
}


//Get the books with the categories
function loadLibraryBooks() {
  var dfd = q.defer();
  getAllBooksAssets()
    .then(function(assets) {
      return loadBooks(assets);
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
 * Load all the books and associate the categories to them
 */
function loadBooks(assets) {
  var dfd = q.defer();

  var assetsIds = assets.map(function(asset) {
    return 'books:Book/' + asset.productId;
  });



  var caller = function(pageNumber, pageSize) {
    return corbelDriver.resources.relation('books:Store', 'booqs:demo', 'books:Book')
      .get(null, {
        pagination: {
          page: pageNumber,
          size: pageSize
        },
        query: [{
          '$in': {
            '_dst_id': assetsIds
          }
        }]
      });
  }

  var booksFound;

  getAllRecursively(caller)
    .then(function(booksFetched) {

      var books = booksFetched.map(function(book) {
        return new BookModel(book);
      });

      var categoriesIds = books.reduce(function(prev, next) {
        if (next.topics.length > 0) {
          next.topics.forEach(function(topicId) {
            if (prev.indexOf(topicId) === -1) {
              prev.push(topicId);
            }
          })
        }
        return prev;
      }, []);

      booksFound = books;

      return fetchCategories(categoriesIds);
    })
    .then(function(categories) {

      booksFound = booksFound.map(function(book) {
        if (book.topics.length > 0) {
          book.topics = book.topics.map(function(topicId) {
            console.log(categories[topicId].name)
            return {
              id: topicId,
              name: categories[topicId].name
            }
          })
        }
        return book;
      });

      dfd.resolve(booksFound);
    })
    .catch(function(err) {
      dfd.reject(err);
    });

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


var BookModel = function(opts) {
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

  //owned
  this.owned = true;

}

/**
 * Triggers the execution
 */
loadLibraryBooks()
  .then(function(books) {

    res.send({
      library: books
    });
  })
  .catch(function(err) {
    compoSR.run('global:parseError', {
      err: err,
      res: res
    });
  });