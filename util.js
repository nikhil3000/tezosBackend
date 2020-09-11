const conseiljs = require('conseiljs');
const util = require('util');
const fetch = require('node-fetch');
const log = require('loglevel');

const {
  oracleAddress,
  ownerAddress,
  poolContractAddress,
  url,
  apiKey,
} = require('./config');
const logger = log.getLogger('conseiljs');
logger.setLevel('warn', false);
conseiljs.registerFetch(fetch);
conseiljs.registerLogger(logger);

const platform = 'tezos';
const network = 'carthagenet';
const entity = 'operations';

const conseilServer = {
  url,
  apiKey,
  network,
};

async function listAccountTransactions(startingBlock) {
  let receiveQuery = conseiljs.ConseilQueryBuilder.blankQuery();
  receiveQuery = conseiljs.ConseilQueryBuilder.addFields(
    receiveQuery,
    'block_level',
    'timestamp',
    'source',
    'destination',
    'amount',
    'fee',
    'counter',
    'operation_group_hash',
    'parameters'
  );
  receiveQuery = conseiljs.ConseilQueryBuilder.addPredicate(
    receiveQuery,
    'block_level',
    conseiljs.ConseilOperator.AFTER,
    [startingBlock]
  );
  receiveQuery = conseiljs.ConseilQueryBuilder.addPredicate(
    receiveQuery,
    'kind',
    conseiljs.ConseilOperator.EQ,
    ['transaction'],
    false
  );

  receiveQuery = conseiljs.ConseilQueryBuilder.addPredicate(
    receiveQuery,
    'destination',
    conseiljs.ConseilOperator.EQ,
    [poolContractAddress],
    false
  );

  receiveQuery = conseiljs.ConseilQueryBuilder.addPredicate(
    receiveQuery,
    'status',
    conseiljs.ConseilOperator.EQ,
    ['applied'],
    false
  );
  receiveQuery = conseiljs.ConseilQueryBuilder.addOrdering(
    receiveQuery,
    'block_level',
    conseiljs.ConseilSortDirection.DESC
  );
  receiveQuery = conseiljs.ConseilQueryBuilder.setLimit(receiveQuery, 100);

  const receiveResult = await conseiljs.ConseilDataClient.executeEntityQuery(
    conseilServer,
    platform,
    network,
    entity,
    receiveQuery
  );
  let totalAmount = 0;
  const betList = {};
  let latestBlock = 0;
  let betCount = 0;
  receiveResult.map((tx) => {
    const {
      source,
      amount,
      operation_group_hash,
      parameters,
      block_level,
      timestamp,
    } = tx;
    if (source != oracleAddress && source != ownerAddress) {
      totalAmount += amount;
      betCount++;
      latestBlock = Math.max(block_level, latestBlock);
      if (typeof betList[source] == 'undefined') {
        betList[source] = [
          { amount, operation_group_hash, parameters, timestamp },
        ];
      } else {
        betList[source].push({
          amount,
          operation_group_hash,
          parameters,
          timestamp,
        });
      }
    }
  });
  console.log(betList);
  return { betList, amount: totalAmount, latestBlock, betCount };
}

// listAccountTransactions(688513);
module.exports = {
  getBetList: listAccountTransactions,
};
