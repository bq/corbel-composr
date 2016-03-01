'use strict'

function proxifyFunction (obj, prop, f) {
  prop.reduce(function (obj, property) {
    if (!obj[property]) throw new Error('Property does not exists in obj: ' + property)
    return obj[property]
  }, obj)
  var objToProxify = getFunctionContainer(obj, prop)
  var functionToProxify = prop[prop.length - 1]
  if (!f && Object.prototype.toString.call(f) === '[object Function]') throw new Error('Proxy property is not a function')
  var currentObjFuncDef = objToProxify[functionToProxify]
  objToProxify[functionToProxify] = f.bind(objToProxify, currentObjFuncDef)
}

function getFunctionContainer (obj, props) {
  var currentProps = props.map(function (item) {
    return item
  })
  currentProps.pop()
  return currentProps.reduce(function (obj, property) {
    if (!obj[property]) throw new Error('Property does not exists in obj: ' + property)
    return obj[property]
  }, obj)
}

module.exports = {
  'proxifyFunction': proxifyFunction
}
