const express=require('express')
const admin_router=express()
const path=require('path')
const session=require('express-session')
const flash=require("connect-flash")
const nocache=require('nocache')

const adminAuth=require('../middleware/adminAuthentication')
const adminController=require('../controllers/adminController')
const saleController=require('../controllers/saleController')
const couponController=require('../controllers/couponController')
const multerhelper=require('../helper/multerConfig')

// Set view engine and views directory
admin_router.set('view engine','ejs')
admin_router.set('views','./views/adminViews')

// Serve static files from the 'public' directory
admin_router.use(express.static('./public'))

// Parse JSON payloads and URL-encoded form data
admin_router.use(express.json())
admin_router.use(express.urlencoded({extended:false}))

// Use session with a secret and disable caching
admin_router.use(session({
  secret:'secret',
  resave:true,
  saveUninitialized:false
}));
admin_router.use(nocache())

// Use flash messages
admin_router.use(flash())

admin_router.get('/',adminAuth.isLogout,adminController.admin)
admin_router.post('/adminLogin',adminAuth.isLogout,adminController.adminlogin)
admin_router.get('/dashboard',adminAuth.isLogin,adminController.dashboard)

//products related router
admin_router.get('/products',adminAuth.isLogin,adminController.productList)
admin_router.get('/addproduct',adminAuth.isLogin,adminController.addProductpage)
admin_router.post('/addingproduct',adminAuth.isLogin,multerhelper.productImageUpload.array('productimage'),adminController.addproducts)
admin_router.get('/updateproduct',adminAuth.isLogin,adminController.editproduct)
admin_router.post('/editproduct',adminAuth.isLogin,multerhelper.productImageUpload.array('productimage'),adminController.updateProduct)
admin_router.get('/delete',adminAuth.isLogin,adminController.deleteproduct)

//*category related routers
admin_router.get('/Categories',adminAuth.isLogin,adminController.Categories)
admin_router.get('/addcategories',adminAuth.isLogin,adminController.addcategories)
admin_router.post('/addcategory',adminAuth.isLogin,adminController.addingCategory)
admin_router.get('/list',adminAuth.isLogin,adminController.listCategories)
admin_router.get('/categoryedit',adminAuth.isLogin,adminController.categoryedit)
admin_router.post('/editcategory',adminAuth.isLogin,adminController.editcategorydone)
admin_router.get('/deletecategory',adminAuth.isLogin,adminController.deletecategory)

//user related routers
admin_router.get('/userslist',adminAuth.isLogin,adminController.userlist)
admin_router.post("/block-user",adminAuth.isLogin,adminController.block_user);
admin_router.post('/unblock-user',adminAuth.isLogin,adminController.unblock_user);

//admin order list management
admin_router.get('/orderlist',adminAuth.isLogin,adminController.orderlist)
admin_router.get('/orderdetails',adminAuth.isLogin,adminController.orderdetails)

//image delete
admin_router.post('/deleteimage',adminAuth.isLogin,adminController.deleteimage)
admin_router.post('/statusupdate',adminAuth.isLogin,adminController.updateStatus)

//admin dashboard chart
admin_router.get('/chartData',adminAuth.isLogin, adminController.fetchChartData)
admin_router.get('/chartData2',adminAuth.isLogin,adminController.chartData2)
admin_router.get('/chartData3',adminAuth.isLogin,adminController.categorywise)
admin_router.get('/salesreport',adminAuth.isLogin,saleController.salesReport)

//admin Coupon management
admin_router.get('/coupon',adminAuth.isLogin,couponController.couponpage)
admin_router.get('/addCoupon',adminAuth.isLogin,couponController.addCoupon)
admin_router.post('/addCoupon',adminAuth.isLogin,couponController.addingCoupon)
admin_router.get('/deletecoupon',adminAuth.isLogin,couponController.deletecoupon)
admin_router.get('/editcouponpage',adminAuth.isLogin,couponController.editcouponpage)
admin_router.post('/editcouponpage',adminAuth.isLogin,couponController.updateeditcouponpage)
admin_router.post("/returnapprove",adminAuth.isLogin, adminController.approveReturn);

//admin product offer
admin_router.get("/productOffer",adminAuth.isLogin,adminController.productOffer)
admin_router.post("/productOffer",adminAuth.isLogin,adminController.addProductOffer)
admin_router.post('/removeProductOffer',adminAuth.isLogin,adminController.removeProductOffer)

//admin category offer
admin_router.get("/categoryOffer",adminAuth.isLogin,adminController.categoryOffer)
admin_router.post("/categoryOffer",adminAuth.isLogin,adminController.addcategoryOffer)
admin_router.post('/removecategoryOffer',adminAuth.isLogin,adminController.removecategoryOffer)

//admin logout router
admin_router.get('/logout',adminAuth.isLogin,adminController.logout)

module.exports=admin_router




