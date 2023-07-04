require('dotenv').config()
const mongoose = require('mongoose')

// Connect to MongoDB
    mongoose.connect(process.env.dbconnect,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    .then(()=>{
        console.log("mongodb connected...");
    }).catch(()=>{
        console.log("Failed to connect");
    })
    
