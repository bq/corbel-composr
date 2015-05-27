var corbel = require('corbel-js');

function generateAssertion(claims, clientSecret){
  claims.aud = corbel.Iam.AUD;
  return corbel.jwt.generate(claims, clientSecret);
}

function getUserAssertion(token, clientSecret, userData){
  var jwtDecoded = corbel.jwt.decode(token);
  var clientId = jwtDecoded.clientId;
  var claims={
    iss:clientId,
    scope:userData.scopes,
    'basic_auth.username':userData.username,
    'basic_auth.password':userData.password
  };
  return generateAssertion(claims, clientSecret);
}

function getClientAssertion(clientData){
  var claims={
    iss:clientData.clientId,
    scope:clientData.scopes
  };
  return generateAssertion(claims, clientData.clientSecret);
}

function getTokenRefreshAssertion(tokenRefresh, userScopes, clientData){
  var claims={
    iss : clientData.clientId,
    scope : userScopes,
    refresh_token: tokenRefresh
  };
  return generateAssertion(claims, clientData.clientSecret);
}

module.exports = {
  generateAssertion: generateAssertion,
  getUserAssertion : getUserAssertion,
  getClientAssertion: getClientAssertion,
  getTokenRefreshAssertion: getTokenRefreshAssertion
}
