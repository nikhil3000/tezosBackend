const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const _ = require('lodash');

require('dotenv').config();
require('./models/userHistory');
require('./models/keyValue');

const { getBetList } = require('./util');

let { mongoURI } = require('./config');
const app = express();

mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log('DB connected', String(mongoURI).substr(0, 5)))
  .catch((err) => console.log('db err', err));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token,X-PINGOTHER'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const UserHistory = mongoose.model('userHistory');
const KeyValue = mongoose.model('keyValue');

app.post('/data', async (req, res) => {
  console.log(req.body);
  let currentBlock = KeyValue.findOne({ key: 'latestBlock' });
  let data = getBetList((await currentBlock).value);
  const address = req.body.address;
  let userHistory = undefined;
  let pastAmount = KeyValue.findOne({ key: 'amount' });
  let pastCount = KeyValue.findOne({ key: 'betCount' });
  if (address) {
    console.log(`Data requested for ${address}`);
    userHistory = UserHistory.findOne({ user: address });
    const { betList, amount, betCount } = await data;
    if (typeof betList[address] != 'undefined') {
      userHistory = await userHistory;
      if (!userHistory) {
        // no bets found for user in db
        res.send({
          betList: betList[address],
          amount: amount + (await pastAmount).value,
          betCount: betCount + (await pastCount).value,
        });
      } else {
        const { betHistory } = userHistory;

        // bet founds for user in db...sending concatenated bet list
        const newBetList = _.uniqBy(
          betHistory.concat(betList[address]),
          'operation_group_hash'
        );
        res.send({
          betList: newBetList,
          amount: amount + (await pastAmount).value,
          betCount: betCount + (await pastCount).value,
        });
      }
    } else {
      // no new bets found for user, sending bets from db
      const { betHistory } = await userHistory;
      res.send({
        betList: betHistory,
        amount: amount + (await pastAmount).value,
        betCount: betCount + (await pastCount).value,
      });
    }
  } else {
    // user data not requested, sending only amount and betCount i.e general Count
    res.send({
      amount: (await data).amount + (await pastAmount).value,
      betCount: (await data).betCount + (await pastCount).value,
    });
  }
  // traverse the betList and save it to db
  const { betList, amount, latestBlock, betCount: count } = await data;
  currentBlock = await currentBlock;
  pastAmount = await pastAmount;
  if (latestBlock > 0) {
    currentBlock.value = latestBlock;
    currentBlock.save();
  }
  pastAmount.value = pastAmount.value + amount;
  pastAmount.save();
  KeyValue.findOne({ key: 'betCount' }).then((betCount) => {
    if (count > 0) {
      betCount.value += count;
      betCount.save().then((obj) => {
        console.log(`betCount saved ${obj}`);
      });
    }
  });
  Object.keys(betList).forEach(function (user, idx) {
    UserHistory.findOne({ user: user }).then((userHistory) => {
      if (!userHistory) {
        newUser = new UserHistory({
          user: user,
          betHistory: betList[user],
        });
        newUser.save().catch((err) => {
          console.log(
            `failed to save ${JSON.stringify(newUser)} because of ${
              err.message
            }`
          );
        });
      } else {
        const { betHistory } = userHistory;
        if (betList[user].length > 0) {
          let newBetList = _.uniqBy(
            betHistory.concat(betList[user]),
            'operation_group_hash'
          );
          userHistory.betHistory = newBetList;
          userHistory.save().then((data) => {
            console.log(`data saved as ${JSON.stringify(userHistory)}`);
          });
        }
      }
    });
  });
});

app.listen(5000, () => {
  console.log('server started at port 5000');
});
