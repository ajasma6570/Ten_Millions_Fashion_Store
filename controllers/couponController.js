const couponModel=require('../models/couponModel')


const couponmanagement={
    
    couponpage:async(req,res)=>{
        try{
            const allcoupon= await couponModel.find({})
            res.render('coupon',{coupons:allcoupon})
        }catch(error){
            res.status(404).render("error", { error: error.message});
        }
    },

    addCoupon:async(req,res)=>{
        try{
            const notice=req.flash('notice')
            res.render('addcoupon',{notice:notice[0]||""})
        }catch(error){
            res.status(404).render("error", { error: error.message});
        }
    },

    addingCoupon:async(req,res)=>{
        try{
            console.log(req.body.code);
            const findcoupon=await couponModel.findOne({couponCode:req.body.code})
            if(findcoupon){
                req.flash("notice","Coupon name Already Exists")
                res.redirect('/admin/addCoupon')
            }else{
                const couponadd=new couponModel({
                    couponCode: req.body.code,
                    couponAmount: req.body.discountprice,
                    expireDate: req.body.expiry,
                    couponDescription: req.body.coupondescription,
                    minimumAmount: req.body.min_purchase,
                })
        
                couponadd.save();
                res.redirect('/admin/coupon')
            }
            
        }catch(error){
            res.status(404).render("error", { error: error.message});
        }
    },

    deletecoupon:async(req,res)=>{
        try{
            const deleteid=req.query.id
            await couponModel.findByIdAndUpdate(deleteid,
                {isDelete:"YES"},
                {new:true})
                res.redirect('/admin/coupon')

        }catch(error){
            res.status(404).render("error", { error: error.message});
        }
    },

    editcouponpage:async(req,res)=>{
        try{
            const couponid=req.query.id
            const coupondetail= await couponModel.findOne({_id:couponid})
            const expireDate = coupondetail.expireDate.toISOString().split("T")[0];
            res.render('editcoupon',{coupon:coupondetail, date:expireDate  })
        }catch(error){
            res.status(404).render("error", { error: error.message});
        }
    },
    updateeditcouponpage:async(req,res)=>{
        try{
            const coupon = await couponModel.updateOne(
                { _id: req.body.id },
                {
                  $set: {
                    couponCode: req.body.code,
                    couponAmount: req.body.discountprice,
                    expireDate: req.body.expiry,
                    couponDescription: req.body.coupondescription,
                    minimumAmount: req.body.min_purchase,
                  },
                }
              );
              res.redirect("/admin/coupon");
            } catch (error) {
              res.render("error", { error: error.message });
        }
        
        }
    
    
 
}

module.exports=couponmanagement