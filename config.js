const mongo_id = process.env.atlasUser;
const mongo_pwd = process.env.atlasPassword;

module.exports = {
  currentBlock: 688513,
  poolContractAddress: 'KT1X7RZUdceFctHxXY84zZzMpgrSfe83TfQQ',
  ownerAddress: 'tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu',
  oracleAddress: 'KT1AcNWb94NGdbKMUzkJ8QFMGjMsePMKS5kS',
  url: 'https://conseil-dev.cryptonomic-infra.tech:443',
  apiKey: process.env.conseilApiKey,
  mongoURI: `mongodb+srv://${mongo_id}:${mongo_pwd}@cluster0-1ohwc.mongodb.net/test?retryWrites=true&w=majority`,
};
