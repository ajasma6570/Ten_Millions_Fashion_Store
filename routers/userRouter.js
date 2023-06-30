const express=require('express')
const user_router=express()
const user_controller=require('../controllers/userController')
const flash=require("connect-flash")
const session=require('express-session')
const nocache=require('nocache')
const {v4:uuidv4}=require('uuid')
const userAuth=require('../authentication/userAuthentication')
const cart_controller=require("../controllers/cartController")
user_router.use(flash())


user_router.set('view engine','ejs')
user_router.set('views','./views/userViews')

user_router.use(express.static('./public'))


//json format urlencoded
user_router.use(express.json())
user_router.use(express.urlencoded({ extended: false }))

//Session side
user_router.use(session({
    secret:uuidv4(),
    resave:false,
    saveUninitialized:true
}));

user_router.use(nocache())



// **********************************user login related routers**********************************
user_router.get('/',user_controller.homepage)
user_router.get('/login',userAuth.isLogout,user_controller.login)
user_router.post('/login',userAuth.isLogout,user_controller.userlogin)
user_router.get('/userprofile',userAuth.isLogin,userAuth.isBlocked,user_controller.userprofile)
user_router.post('/addaddress',userAuth.isLogin,userAuth.isBlocked,user_controller.addaddress)
user_router.get('/addaddress',userAuth.isLogin,userAuth.isBlocked,user_controller.addaddresscheckout)
user_router.get('/deleteAddress',userAuth.isLogin,userAuth.isBlocked,user_controller.deleteAddress)
user_router.post('/checkoutaddaddress',userAuth.isLogin,userAuth.isBlocked,user_controller.checkoutaddaddress)
user_router.get('/checkout',userAuth.isLogin,userAuth.isBlocked,user_controller.checkout)
user_router.post('/placeOrder',userAuth.isLogin,userAuth.isBlocked,user_controller.placeOrder)
user_router.get('/ordercomplete',userAuth.isLogin,userAuth.isBlocked,user_controller.ordercomplete)

//********************************** user login with OTP related routers**********************************

user_router.get('/loginWithOtp',userAuth.isLogout,user_controller.loginWithOtp)
user_router.post('/OTPpage',userAuth.isLogout,user_controller.otpSend)
user_router.post('/otp',userAuth.isLogout,user_controller.otpVerify)
user_router.get('/otpload',userAuth.isLogout,user_controller.otpload)
user_router.post('/otptimeout',userAuth.isLogout,user_controller.otptimeout)
user_router.get('/otpresend',userAuth.isLogout,user_controller.otpresend)

//**********************************user password change**********************************

user_router.get('/forgetpassword',userAuth.isLogin,userAuth.isBlocked,user_controller.forgetpassword)
user_router.post('/forgetOTPpage',userAuth.isLogin,userAuth.isBlocked,user_controller.forgetOTPpage)
user_router.post('/ForgetotpVerify',userAuth.isLogin,userAuth.isBlocked,user_controller.ForgetotpVerify)
user_router.post('/passwordChanged',userAuth.isLogin,userAuth.isBlocked,user_controller.passwordChanged)

// **********************************user signup related routers**********************************

user_router.get('/signup',userAuth.isLogout,user_controller.signup)
user_router.post('/newuser',userAuth.isLogout,user_controller.checkuser)
user_router.post('/signupOTP',userAuth.isLogout,user_controller.signupOTP)
user_router.post('/SignupOTPpage',userAuth.isLogout,user_controller.SignupotpSend)
user_router.post('/SignUpotpverify',userAuth.isLogout,user_controller.SignUpotpVerify)
user_router.post('/newuserotp',userAuth.isLogout,user_controller.newuser)
user_router.get('/SignUpotpresend',userAuth.isLogout,user_controller.SignUpotpresend)

// **********************************user product page router**************************

user_router.get('/shirts',userAuth.isLogin,userAuth.isBlocked,user_controller.shirtpageload)
user_router.get('/viewproductpage',userAuth.isLogin,userAuth.isBlocked,user_controller.shirtview)

//**********************************user product cart**********************************

user_router.get('/cart',userAuth.isLogin,userAuth.isBlocked,cart_controller.cartview)
user_router.get('/addtocart',userAuth.isLogin,userAuth.isBlocked,cart_controller.addtocart)
user_router.get('/deleteCartItem',userAuth.isLogin,userAuth.isBlocked,cart_controller.deleteCartItem)
user_router.post('/incrementproduct',userAuth.isLogin,userAuth.isBlocked,cart_controller.increment_product);
user_router.post('/decrement',userAuth.isLogin,userAuth.isBlocked,cart_controller.decrement_product);
user_router.post('/productsearch',userAuth.isLogin,userAuth.isBlocked,user_controller.productsearch)

//**********************************about us*********************************************

user_router.get('/about',userAuth.isLogin,userAuth.isBlocked,user_controller.about)

//**********************************contact us********************************************

user_router.get('/contactus',userAuth.isLogin,userAuth.isBlocked,user_controller.contactus)

//**********************************user dashboard*****************************************
user_router.get('/userorder',userAuth.isLogin,userAuth.isBlocked,user_controller.userorder)
user_router.get('/userAddress',userAuth.isLogin,userAuth.isBlocked,user_controller.userAddress)
user_router.get('/userAddAddress',userAuth.isLogin,userAuth.isBlocked,user_controller.userAddAddress)
user_router.get('/edituserAddress',userAuth.isLogin,userAuth.isBlocked,user_controller.edituserAddress)
user_router.post('/EditUseraddress',userAuth.isLogin,userAuth.isBlocked,user_controller.UseraddressEdit)
user_router.get('/trackorder',userAuth.isLogin,userAuth.isBlocked,user_controller.trackorder)
user_router.get('/userorderdetail',userAuth.isLogin,userAuth.isBlocked,user_controller.userorderdetail)
user_router.get('/useraccount',userAuth.isLogin,userAuth.isBlocked,user_controller.useraccount)
user_router.post('/userAccountEdit',userAuth.isLogin,userAuth.isBlocked,user_controller.userAccountEdit)
user_router.post('/razorpay',userAuth.isLogin,userAuth.isBlocked,user_controller.createOrder)
user_router.post('/userEditSucess',userAuth.isLogin,userAuth.isBlocked,user_controller.userEditSucess)

// **********************************user logout related routers****************************

user_router.get('/logout',userAuth.isLogin,userAuth.isBlocked,user_controller.logout)
user_router.post('/upload-profile-photo',userAuth.isLogin,userAuth.isBlocked,user_controller.uploadprofilephoto)

//**********************************user coupon *********************************************

user_router.post('/checkvalidcoupon',userAuth.isLogin,userAuth.isBlocked,user_controller.checkvalid_Coupon)

//**********************************wallet***************************************************
user_router.get('/wallet',userAuth.isLogin,userAuth.isBlocked,user_controller.walletload)
user_router.post("/cancelorder",userAuth.isLogin,userAuth.isBlocked,user_controller.cancelOrder);
user_router.post("/returnorder",userAuth.isLogin,userAuth.isBlocked,user_controller.returnRequest);



//***************************************User Router END*********************************************
module.exports=user_router  