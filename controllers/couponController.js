const couponModel = require("../models/couponModel");

const couponmanagement = {

// This function retrieves all coupons from the database and renders the coupon management page, displaying all the available coupons.
  couponpage: async (req, res) => {
    try {
      const allcoupon = await couponModel.find({});
      res.render("coupon", { coupons: allcoupon });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function renders the "Add Coupon" page and displays a flash message if there is any.
  addCoupon: async (req, res) => {
    try {
      const notice = req.flash("notice");
      res.render("addcoupon", { notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//: This function adds a new coupon to the database. It checks if the coupon code already exists and if not, saves the new coupon.
  addingCoupon: async (req, res) => {
    try {
      console.log(req.body.code);
      const findcoupon = await couponModel.findOne({
        couponCode: req.body.code,
      });
      if (findcoupon) {
        req.flash("notice", "Coupon name Already Exists");
        res.redirect("/admin/addCoupon");
      } else {
        const couponadd = new couponModel({
          couponCode: req.body.code,
          couponAmount: req.body.discountprice,
          expireDate: req.body.expiry,
          couponDescription: req.body.coupondescription,
          minimumAmount: req.body.min_purchase,
        });

        couponadd.save();
        res.redirect("/admin/coupon");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function deletes a coupon from the database based on the coupon ID.
  deletecoupon: async (req, res) => {
    try {
      const deleteid = req.query.id;
      await couponModel.findByIdAndUpdate(
        deleteid,
        { isDelete: "YES" },
        { new: true }
      );
      res.redirect("/admin/coupon");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function renders the "Edit Coupon" page with the details of the selected coupon to be edited.
  editcouponpage: async (req, res) => {
    try {
      const couponid = req.query.id;
      const coupondetail = await couponModel.findOne({ _id: couponid });
      const expireDate = coupondetail.expireDate.toISOString().split("T")[0];
      res.render("editcoupon", { coupon: coupondetail, date: expireDate });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function updates the details of a coupon in the database based on the edited information.
  updateeditcouponpage: async (req, res) => {
    try {
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
      res.render("error", { error: error.message });
    }
  },
};

module.exports = couponmanagement;
