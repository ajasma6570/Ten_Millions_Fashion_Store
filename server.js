require('./config/mongDBConnect')
const express=require('express')
const userRouter=require('./routers/userRouter')


const PORT=process.env.PORT

const app=express()

// Use the userRouter for routes starting from '/'
app.use('/',userRouter)



// Start the server
app.listen(PORT,()=>{
    console.log(`Server started ${PORT}`);
})
