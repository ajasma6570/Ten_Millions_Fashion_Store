const mongoose=require("mongoose")

const walletschema=new mongoose.Schema({

    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    balance:{
        type:Number,
        required:true,
    },
    orderDetails:[{
        orderid:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"order",
            required:true,
        },
        amount:{
            type:Number,
            required:true,
        },
        date:{
            type:Date,
            default:Date.now,
            required:true,
        },
        type:{
            type:String,
            required:true,
        }, 
        
    }]

})

const walletModel=mongoose.model("WalletModel",walletschema)

module.exports=walletModel