const mongoose=require('mongoose')

const productSchema=new mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    productnamelower:{
        type:String,
        required: true
    },
    category:{
        type:String,
        required:true
    },
    brand: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price:{
        type:Number,
        required:true
    },
    description: {
        type: String,
        required: true
    },
    
    productimage: {
        type: Array,
        required: true,
        validate: [arrayLimit, "maximum 4 product images allowed"]
    },
    offerpercentage: {
      type: Number,
      default: 0,
    },
    offerprice: {
      type: Number,
      default: 0,
    },
    categorypercentage: {
      type: Number,
      default: 0,
    },
    categoryprice: {
      type: Number,
      default: 0,
    },
    isDelete: {
        type: Boolean,
        default: false,
      }
})

function arrayLimit(val){
    return val.length<=4;
}

 const products=mongoose.model('products',productSchema)
 
 module.exports=products