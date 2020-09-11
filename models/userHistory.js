const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userHistory = new Schema({
  user: {
    type: String,
    required: true,
    index: { unique: true },
  },
  betHistory: Array,
});

mongoose.model('userHistory', userHistory);
