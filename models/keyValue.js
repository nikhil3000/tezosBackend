const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const keyValue = new Schema({
  key: String,
  value: {},
});

mongoose.model('keyValue', keyValue);
