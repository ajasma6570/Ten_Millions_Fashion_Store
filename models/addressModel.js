

const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    State: {
      type: String,
      required: true,
    },
    Pincode: {
      type: Number,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    landmark: {
      type: String,
    },
  }
);

const useraddress = mongoose.model("useraddress", addressSchema);

module.exports=useraddress