function getAdminClient(){
  var clientData = require('../../fixtures/client/clientAdmin.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var adminClientData = {
    clientId : process.env.COMPOSR_TEST_ADMINUSER_CLIENTID ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTID : clientData.clientId,
    clientSecret : process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET : clientData.clientSecret,
    scopes : process.env.COMPOSR_TEST_ADMINUSER_SCOPES ? process.env.COMPOSR_TEST_ADMINUSER_SCOPES : clientData.scopes
  };

  return adminClientData;
}

function getDemoClient(){
  var clientData = require('../../fixtures/client/clientDemo.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var demoClientData = {
    clientId : process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTID ? process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTID : clientData.clientId,
    clientSecret : process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTSECRET ? process.env.COMPOSR_TEST_DEMOCLIENT_CLIENTSECRET : clientData.clientSecret,
    scopes : process.env.COMPOSR_TEST_DEMOCLIENT_SCOPES ? process.env.COMPOSR_TEST_DEMOCLIENT_SCOPES : clientData.scopes
  };

  return demoClientData;
}

function getUser(){
  var clientData = require('../../fixtures/user/userDemo.json');

  //Use environment variables (if jenkins provided those), fixtures ones other way.
  var demoClientData = {
    clientId : process.env.COMPOSR_TEST_DEMOUSER_CLIENTID ? process.env.COMPOSR_TEST_DEMOUSER_CLIENTID : clientData.clientId,
    clientSecret : process.env.COMPOSR_TEST_DEMOUSER_CLIENTSECRET ? process.env.COMPOSR_TEST_DEMOUSER_CLIENTSECRET : clientData.clientSecret,
    scopes : process.env.COMPOSR_TEST_DEMOUSER_SCOPES ? process.env.COMPOSR_TEST_DEMOUSER_SCOPES : clientData.scopes
  };

  return demoClientData;
}

module.exports = {
  getAdminClient : getAdminClient,
  getUser : getUser,
  getDemoClient : getDemoClient
}
