const mongoose=require('mongoose')


const orderSchema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    products:[
        {
            productid:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"products",
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
            }
        }
    ],
    totalAmount:{
        type:Number,
        required:true,
    },
    couponCode: {
        type: String,
        default: null,
    },
    couponAmount: {
        type: Number,
        required: true,
    },
    PaymentMethod: {
        type:String,
        required: true
    },
    status: {
        type: String,
        default: "Pending",
      },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "useraddress",
        required: true,
      },
    orderDate: {
        type: Date,
        default: Date.now,
      },
      delete:{
        type:String,
        default: "NO",
    },
    paymentStatus: {
        type: String,
        required: true,
      },
    }
    )

module.exports=mongoose.model("order",orderSchema)