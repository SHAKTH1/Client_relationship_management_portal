const mongoose = require('mongoose');
const visitSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  collectionType: { type: String, enum: ['Client', 'SyndicateClient'], required: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date, default: null },
  hereToMeet: { type: String, required: true }, // New field
  agenda: { type: String, required: true } // New field
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
