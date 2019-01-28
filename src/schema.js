const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(
  process.env.HLFBOT_MONGO_CONNECTION_URI,
  { useNewUrlParser: true }
);

const PromoSchema = new Schema(
  {
    code: {
      type: String,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    ipId: {
      type: String,
      default: ''
    },
    tabTeam: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const promoModel = new mongoose.model('Promo', PromoSchema);
module.exports = promoModel;
