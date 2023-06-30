const mongoose=require('mongoose')

const categorySchema= mongoose.Schema({

    categoryName:{
        type:String,
        required:true
    },
    
    categoryLower:{
        type:String,
        required:true
    },

    categoryDescription:{
        type:String,
        required:true
    },
    categorypercentage: {
      type: Number,
      default: 0,
    },

    list:{
        type:Number,
        default:0
    }

})

const category=mongoose.model("category",categorySchema)

module.exports=category