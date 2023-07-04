require('./config/mongDBConnect')
const express=require('express')
const userRouter=require('./routers/userRouter')
const adminRouter=require('./routers/adminRouter')

const PORT=process.env.PORT

const app=express()

// Use the userRouter for routes starting from '/'
app.use('/',userRouter)

// Use the adminRouter for routes starting from '/admin'
app.use('/admin',adminRouter)

// Start the server
app.listen(PORT,()=>{
    console.log(`Server started ${PORT}`);
})
