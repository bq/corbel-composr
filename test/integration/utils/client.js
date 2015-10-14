function getAdminClient(){
  var clientData = require('../../fixtures/client/_clientAdmin.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var adminClientData = {
    clientId : process.env.COMPOSR_TEST_ADMINUSER_CLIENTID ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTID : clientData.clientId,
    clientSecret : process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET : clientData.clientSecret,
    scopes : process.env.COMPOSR_TEST_ADMINUSER_SCOPES ? process.env.COMPOSR_TEST_ADMINUSER_SCOPES : clientData.scopes
  };

  return adminClientData;
}

function getDemoClient(){
  var clientData = require('../../fixtures/client/_clientDemo.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var demoClientData = {
    clientId : process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTID ? process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTID : clientData.clientId,
    clientSecret : process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTSECRET ? process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTSECRET : clientData.clientSecret,
    scopes : process.env.COMPOSR_TEST_DEMOCLIENT_SCOPES ? process.env.COMPOSR_TEST_DEMOCLIENT_SCOPES : clientData.scopes
  };

  return demoClientData;
}

function getUser(){
  var userData = require('../../fixtures/user/_userDemo.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var demoUserData = {
    username : process.env.COMPOSR_TEST_DEMOUSER_USERNAME ? process.env.COMPOSR_TEST_DEMOUSER_USERNAME : userData.username,
    password : process.env.COMPOSR_TEST_DEMOUSER_PASSWORD ? process.env.COMPOSR_TEST_DEMOUSER_PASSWORD : userData.password,
    scopes : process.env.COMPOSR_TEST_DEMOUSER_SCOPES ? process.env.COMPOSR_TEST_DEMOUSER_SCOPES : userData.scopes
  };

  return demoUserData;
}

module.exports = {
  getAdminClient : getAdminClient,
  getUser : getUser,
  getDemoClient : getDemoClient
}
