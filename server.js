require('dotenv').config();
const mongoose = require('mongoose')
const PORT=process.env.PORT || 3700
mongoose.connect(process.env.dbconnect)
.then(()=>{
    console.log("mongodb connected...");
}).catch(()=>{
    console.log("Failed to connect");
})

const express=require('express')
const app=express()



const userRouter=require('./routers/userRouter')
app.use('/',userRouter)


const adminRouter=require('./routers/adminRouter')
app.use('/admin',adminRouter)



app.listen(PORT,()=>{
    console.log(`Server started ${PORT}`);
})
