const mongoose=require("mongoose")

const couponschema=new mongoose.Schema({
    
        usedUsers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
        ],
        couponCode:{
            type:String,
            required:true
        },
        couponAmount: {
            type: Number,
            required: true,
        },
        expireDate: {
            type: Date,
            required: true,
        },
        couponDescription: {
            type: String,
            required: true,
        },
        minimumAmount: {
            type: Number,
            required: true,
        },
        isDelete:{
            type:String,
            default:"NO"
        }
    
})

couponschema.pre("save", function (next) {
    const currentDate = new Date();
    if (this.expireDate <= currentDate) {
      // The expiration date has passed or is equal to the current date
      this.isDelete = "YES"; // Set isDelete field to "YES" or perform any other required action
    }
    next();
  });


const couponModel=mongoose.model("couponModel",couponschema)

module.exports=couponModel



