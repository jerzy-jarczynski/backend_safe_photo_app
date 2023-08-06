const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoterSchema = new Schema({
  user: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: 'Photo' }],
});

module.exports = mongoose.model('Voter', VoterSchema);