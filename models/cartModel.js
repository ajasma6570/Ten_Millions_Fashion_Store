const mongoose=require('mongoose')

const cartSchema=new mongoose.Schema({
    userID:{
        type: String,
        ref:"user",
        required:true,
    },
    products:[{
        productid: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"products",
            required:true,
        },
        Cartquantity:{
            type:Number,
            default:1,
            required:true,

        }
    }],

}
)

const cart=mongoose.model("cart",cartSchema)

module.exports=cart;