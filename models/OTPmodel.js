const {Schema,model}=require('mongoose')
const otpSchema=new Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        index:{expires:180}
    }
});

const otp=model("otp",otpSchema)

module.exports=otp;