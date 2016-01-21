'use strict'

var transactions = {}

var addTransaction = function (id) {
  if (!transactions.hasOwnProperty(id)) {
    transactions[id] = {'id': id, 'segments': []}
  }
}

var addSegment = function (transactionId, segment) {
  if (!transactions.hasOwnProperty(transactionId)) {
    addTransaction(transactionId)
  }
  transactions[transactionId].segments.push(segment)
}

var getTransactions = function () {
  return transactions
}

var getTransactionById = function (transactionId) {
  if (!transactions.hasOwnProperty(transactionId)) {
    return null
  }
  return transactions[transactionId]
}

var deleteTransactionById = function (transactionId) {
  if (transactions.hasOwnProperty(transactionId)) {
    delete transactions[transactionId]
  }
}

var deleteTransactions = function () {
  transactions = {}
}

module.exports = {
  addTransaction: addTransaction,
  addSegment: addSegment,
  getTransactionById: getTransactionById,
  deleteTransactionById: deleteTransactionById,
  getTransactions: getTransactions,
  deleteTransactions: deleteTransactions
}
