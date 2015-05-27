var corbel = require('corbel-js');

function generateAssertion(claims, clientSecret){
  return corbel.jwt.generate(claims, clientSecret);
}

function getUserAssertion(token, clientSecret, userData){
  var jwtDecoded = corbel.jwt.decode(token);
  var clientId = jwtDecoded.clientId;
  var claims={
    iss:clientId,
    scopes:userData.scopes,
    'basic_auth.username':userData.username,
    'basic_auth.password':userData.password
  };
  return generateAssertion(claims, clientSecret);
}

function getClientAssertion(token, clientSecret, clientData){
  var jwtDecoded = corbel.jwt.decode(token);
  var clientId = jwtDecoded.clientId;
  var claims={
    iss:clientId,
    scopes:clientData.scopes
  };
  return generateAssertion(claims, clientSecret);
}

module.exports {
  generateAssertion: generateAssertion,
  getUserAssertion : getUserAssertion,
  getClientAssertion: getClientAssertion
}
