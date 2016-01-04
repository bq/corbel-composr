'use strict'

var mkdirp = require('mkdirp')

function makePath(path){
  mkdirp.sync(path)
}

function getPathFromFilePath(filePath){
  return filePath.split('/').slice(0, -1).join('/')
}

module.exports = {
  makePath,
  getPathFromFilePath
}