require('dotenv').config();
const mongoose = require('mongoose')
const express=require('express')
const userRouter=require('./routers/userRouter')
const adminRouter=require('./routers/adminRouter')

const PORT=process.env.PORT || 3700

// Connect to MongoDB
mongoose.connect(process.env.dbconnect)
.then(()=>{
    console.log("mongodb connected...");
}).catch(()=>{
    console.log("Failed to connect");
})

const app=express()

// Use the userRouter for routes starting from '/'
app.use('/',userRouter)

// Use the adminRouter for routes starting from '/admin'
app.use('/admin',adminRouter)

// Start the server
app.listen(PORT,()=>{
    console.log(`Server started ${PORT}`);
})
