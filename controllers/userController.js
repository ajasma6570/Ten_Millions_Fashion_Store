const mongoose = require("mongoose");
const otp = require("../models/OTPmodel");
const collection = require("../models/userModel");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const product = require("../models/productModel");
const category = require("../models/categoriesmodel");
const usersignup = require("../models/usersignupModel");
const userSignupotp = require("../models/userSignupOTP");
const useraddress = require("../models/addressModel");
const cart = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const Razorpay = require("razorpay");
const multer = require("multer");
const path = require("path");
const couponModel = require("../models/couponModel");
const walletModel = require("../models/walletModel");

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/profileimages");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const user = {
  //***********************************Dashbord********************************************

  homepage: async (req, res) => {
    try {
      if (req.session.userid) {
        const data = await collection.findOne({ email: req.session.userid });
        res
          .status(200)
          .render("homepage", {
            title: "Hi, " + data.name,
            session: req.session.userid,
          });
      } else {
        res.status(200).render("homepage");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************Login controller********************************************

  login: (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("login", { notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userlogin: async (req, res) => {
    try {
      let userdata = await collection.findOne({ email: req.body.loginEmail });
      if (userdata) {
        if (userdata.block === 0) {
          if (userdata.password === req.body.loginPassword) {
            req.session.userid = req.body.loginEmail;
            const productdata = await product.find({});
            res
              .status(200)
              .render("homepage", {
                title: "Hi, " + userdata.name,
                session: req.session.userid,
                product: productdata,
              });
          } else {
            res.status(200).render("login", { notice: "Password incorrect" });
          }
        } else {
          res.status(200).render("login", { notice: "Account blocked" });
        }
      } else {
        res.status(200).render("login", { notice: "No user found!!!" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  //***********************************user Dashboard controller********************************************
  userprofile: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      res
        .status(200)
        .render("userDashboard", {
          session: req.session.userid,
          title: "Hi, " + userdetail.name,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userorder: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      const addressdetails = await useraddress.find({ userid: userdetail._id });
      const orders = await orderModel
        .find({ userid: userdetail._id })
        .populate("products.productid")
        .populate("address")
        .exec();

      res
        .status(200)
        .render("userorder", {
          session: req.session.userid,
          title: "Hi, " + userdetail.name,
          address: addressdetails,
          orders: orders,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  userAddress: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      const addressdetails = await useraddress.find({ userid: userdetail._id });
      res
        .status(200)
        .render("userAddress", {
          session: req.session.userid,
          title: "Hi, " + userdetail.name,
          address: addressdetails,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userAddAddress: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      res
        .status(200)
        .render("userAddAddress", {
          session: req.session.userid,
          title: "Hi, " + userdetail.name,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  edituserAddress: async (req, res) => {
    try {
      const user = req.query.id;
      const addressdetail = await useraddress.findOne({ _id: user });

      res
        .status(200)
        .render("userEditAddress", {
          session: req.session.userid,
          address: addressdetail,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  UseraddressEdit: async (req, res) => {
    try {
      dataobj = {
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        State: req.body.state,
        Pincode: req.body.pincode,
        phone: req.body.phonenumber,
        landmark: req.body.landmark,
      };

      const addressData = await useraddress.findByIdAndUpdate(
        { _id: req.body.id },
        { $set: dataobj },
        { new: true }
      );
      res.status(200).redirect("/userAddress");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  addaddress: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      const address = new useraddress({
        userid: userdetails._id,
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        State: req.body.state,
        Pincode: req.body.pincode,
        phone: req.body.phonenumber,
        landmark: req.body.landmark,
      });
      await address.save();
      res.status(200).redirect("/userAddress");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  deleteAddress: async (req, res) => {
    try {
      const addressid = req.query.id;
      const del = await useraddress.deleteOne({ _id: addressid });
      res.status(200).redirect("/userAddress");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  checkout: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      const addressdetails = await useraddress.find({ userid: userdetails.id });
      const productdetails = await cart
        .findOne({ userID: req.session.userid })
        .populate("products.productid");
      const coupon = await couponModel.find({});
      const wallet = await walletModel.findOne({ userid: userdetails._id });
      res
        .status(200)
        .render("checkout", {
          addresses: addressdetails,
          products: productdetails,
          session: req.session.userid,
          title: "Hi, " + userdetails.name,
          coupons: coupon,
          wallet: wallet,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  addaddresscheckout: async (req, res) => {
    try {
      res.status(200).render("addaddress", { session: req.session.userid });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  checkoutaddaddress: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      const address = new useraddress({
        userid: userdetails._id,
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        State: req.body.state,
        Pincode: req.body.pincode,
        phone: req.body.phonenumber,
        landmark: req.body.landmark,
      });
      await address.save();
      res.status(200).redirect("/checkout");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  placeOrder: async (req, res) => {
    try {
      let flag = 0,
        stockOut = [];
      const address = req.body.address;
      const total = req.body.total;
      const paymentMethod = req.body.paymentmethod;
      const user = req.session.userid;
      const userdetails = await collection.findOne({ email: user });
      const couponusedcode = req.body.couponCode;
      const couponamount = req.body.couponAmount;
      let paymentStatus;
      console.log("**************************************************");
      console.log(paymentMethod);
      if (paymentMethod === "Razorpay" || paymentMethod === "Wallet") {
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Unpaid";
      }

      const cartdetail = await cart
        .findOne({ userID: user })
        .populate("products.productid");

      cartdetail.products.forEach(async (productdetail) => {
        const pro = await product.findOne({ _id: productdetail.productid });
        if (productdetail.Cartquantity > pro.quantity) {
          flag = 1;
          stockOut.push({ name: pro.productname, available: pro.quantity });
        }
      });

      const couponupdate = await couponModel.findOneAndUpdate(
        { couponCode: couponusedcode },
        { $push: { usedUsers: userdetails._id } }
      );
      if (flag == 0) {
        const orderdetail = new orderModel({
          userid: userdetails._id,
          totalAmount: total,
          PaymentMethod: paymentMethod,
          address: address,
          paymentStatus: paymentStatus,
          couponAmount: couponamount,
        });

        if (couponusedcode) {
          orderdetail.couponCode = couponusedcode;
        }

        cartdetail.products.forEach(async (productdetail) => {
          let qty = productdetail.Cartquantity;
          let idpro = productdetail.productid;
          orderdetail.products.push({
            productid: idpro,
            quantity: qty,
          });

          await product.updateOne({ _id: idpro }, { $inc: { quantity: -qty } });
        });

        const newOrder = await orderdetail.save();

        if (paymentMethod == "Wallet") {
          await walletModel.updateOne(
            { userid: userdetails._id },
            {
              $inc: { balance: -newOrder.totalAmount },
              $push: {
                orderDetails: {
                  orderid: newOrder._id,
                  amount: newOrder.totalAmount,
                  type: "Debited",
                },
              },
            },
            { new: true }
          );
        }
        res.status(200).send({ message: "1" }).json();
      } else {
        res
          .status(200)
          .send({ message: "0", msg: "Some products are out of Stock" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  ordercomplete: async (req, res) => {
    try {
      const user = req.session.userid;
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      const cartdetails = await cart
        .findOne({ userID: user })
        .populate("products.productid");
      await cart.findOneAndDelete({ userID: user });
      res
        .status(200)
        .render("orderComplete", {
          session: req.session.userid,
          order: cartdetails,
          title: "Hi, " + userdetails.name,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  trackorder: async (req, res) => {
    try {
      res.status(200).render("trackorder", { session: req.session.userid });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userorderdetail: async (req, res) => {
    try {
      const userfind = await collection.findOne({ email: req.session.userid });
      const orderid = req.query.id;
      const orderdetails = await orderModel
        .findById({ _id: orderid })
        .populate("products.productid")
        .populate("address")
        .populate("userid")
        .exec();
      res
        .status(200)
        .render("userorderDetails", {
          session: req.session.userid,
          orderDetail: orderdetails,
          title: "Hi, " + userfind.name,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  //***********************************signup controller********************************************

  signup: (req, res) => {
    try {
      const notice = req.flash("notice");
      res
        .status(200)
        .render("userOtpSignup", { sign2: "d-none", notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  checkuser: async (req, res) => {
    try {
      let checkingData = await collection.findOne({
        email: req.body.signupEmail,
      });
      console.log(req.body.signupEmail);
      if (checkingData) {
        res.status(200).render("usersignup", { notice: "Already registered" });
      } else {
        const data = new user({
          name: req.body.signupName,
          email: req.body.signupEmail,
          phone: req.body.signupPhone,
          password: req.body.signupPassword,
          admin: 0,
        });
        await data.save();

        const OTP = otpGenerator.generate(4, {
          digits: true,
          alphabets: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });

        console.log(OTP);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "ajasmaprince@gmail.com",
            pass: "ydkvwkujlbgrcdjo",
          },
        });
        var mailOptions = {
          from: "ajasmaprince@gmail.com",
          to: req.body.signupEmail,
          subject: "OTP VERIFICATION",
          text: "PLEASE ENTER THE OTP FOR LOGIN " + OTP,
        };
        transporter.sendMail(mailOptions, function (error, info) {});
        console.log(OTP);
        const Otp = new userSignupotp({
          email: req.body.signupEmail,
          otp: OTP,
        });
        const salt = await bcrypt.genSalt(10);
        Otp.otp = await bcrypt.hash(Otp.otp, salt);
        const result = await Otp.save();

        res.status(200).render("usersignupOTPpage", { model: "1", data: data });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  signupOTP: async (req, res) => {
    try {
      const useremail = req.body.signupEmail;
      const userotp = req.body.otp;
      console.log(userotp);
      console.log(req.body.signupEmail);
      const otpHolder = await userSignupotp.findOne({ email: useremail });
      console.log(otpHolder);
      if (otpHolder) {
        const validuser = await bcrypt.compare(userotp, otpHolder.otp);
        console.log(validuser);
        if (validuser) {
          const data = new collection({
            name: req.body.signupName,
            email: req.body.signupEmail,
            phone: req.body.signupPhone,
            password: req.body.signupPassword,
            admin: 0,
          });
          await data.save();

          await usersignup.deleteOne({ _id: req.body.id });
          await userSignupotp.deleteOne({ _id: otpHolder._id });
          res.render("login");
        } else {
          console.log(req.body.id);
          await usersignup.deleteOne({ _id: req.body.id });

          console.log("otp wrong");
          req.flash("notice", "your OTP is wrong Re-enter details");
          res.redirect("/signup");
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP Re-enter details");
        res.redirect("/signup");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************login with OTP controller********************************************

  loginWithOtp: (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("loginwithOtp", { notice: notice[0] });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  OTPpage: (req, res) => {
    try {
      res.status(200).render("OTPpage");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  otpSend: async (req, res) => {
    try {
      const userdata = await collection.findOne({ email: req.body.email });
      if (userdata) {
        if (userdata.block === 0) {
          const OTP = otpGenerator.generate(4, {
            digits: true,
            alphabets: false,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
          });
          console.log(OTP);
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "ajasmaprince@gmail.com",
              pass: "ydkvwkujlbgrcdjo",
            },
          });
          var mailOptions = {
            from: "ajasmaprince@gmail.com",
            to: userdata.email,
            subject: "OTP VERIFICATION",
            text: "PLEASE ENTER THE OTP FOR LOGIN " + OTP,
          };
          transporter.sendMail(mailOptions, function (error, info) {});
          console.log(OTP);
          const Otp = new otp({ email: req.body.email, otp: OTP });
          const salt = await bcrypt.genSalt(10);
          Otp.otp = await bcrypt.hash(Otp.otp, salt);
          const result = await Otp.save();

          res.status(200).render("OTPpage", { data: result });
        } else {
          console.log("user not found");
          req.flash("notice", "user not found");
          res.status(200).redirect("/loginWithOtp");
        }
      } else {
        req.flash("notice", "user not found");
        res.status(200).redirect("/loginWithOtp");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  otpVerify: async (req, res) => {
    try {
      const useremail = req.body.email;
      const userotp = req.body.otp;
      const otpHolder = await otp.findOne({ email: useremail });

      if (otpHolder) {
        const validuser = await bcrypt.compare(userotp, otpHolder.otp);
        if (validuser) {
          req.session.userid = req.body.email;
          const data = await collection.findOne({ email: req.session.userid });
          await otp.deleteMany({ email: req.session.userid });
          res
            .status(200)
            .render("homepage", {
              title: "Hi, " + data.name,
              session: req.session.userid,
            });
        } else {
          console.log("otp wrong");
          console.log(useremail);
          const finduser = await otp.findOne({ email: useremail });

          res
            .status(200)
            .render("OTPpage", {
              data: finduser,
              notice: " Wrong OTP , Re-enter OTP",
            });
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP");
        res.status(200).redirect("/loginWithOtp");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  otpload: (req, res) => {
    try {
      const title = req.flash("notice");
      res.status(200).render("loginWithOtp", { notice: title[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  otptimeout: async (req, res) => {
    try {
      const otpfind = await otp.findOne({ email: req.body.email });
      if (otpfind) {
        await otp.deleteOne({ _id: otpfind._id });
        res.status(200).send({ message: "0" });
      } else {
        res.status(200).send({ message: "1" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  otpresend: async (req, res) => {
    try {
      const emailID = req.query.id;
      const userdata = await collection.findOne({ email: emailID });
      if (userdata) {
        if (userdata.block === 0) {
          const existingOTP = await otp.findOne({ email: emailID });
          // If there is an existing OTP, update it and resend
          if (existingOTP) {
            const OTP = otpGenerator.generate(4, {
              digits: true,
              alphabets: false,
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
              specialChars: false,
            });

            const salt = await bcrypt.genSalt(10);
            existingOTP.otp = await bcrypt.hash(OTP, salt);
            await existingOTP.save();

            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "ajasmaprince@gmail.com",
                pass: "ydkvwkujlbgrcdjo",
              },
            });

            var mailOptions = {
              from: "ajasmaprince@gmail.com",
              to: userdata.email,
              subject: "OTP VERIFICATION",
              text: "PLEASE ENTER THE OTP FOR LOGIN: " + OTP,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                // Handle error sending email
              } else {
                // Email sent successfully
                console.log("OTP email sent");
              }
            });

            console.log(OTP);

            res.status(200).render("OTPpage", { data: existingOTP });
          } else {
            // Generate a new OTP and save it
            const OTP = otpGenerator.generate(4, {
              digits: true,
              alphabets: false,
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
              specialChars: false,
            });

            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "ajasmaprince@gmail.com",
                pass: "ydkvwkujlbgrcdjo",
              },
            });

            var mailOptions = {
              from: "ajasmaprince@gmail.com",
              to: userdata.email,
              subject: "OTP VERIFICATION",
              text: "PLEASE ENTER THE OTP FOR LOGIN: " + OTP,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.status(500).send({ success: false, msg: error.message });
              } else {
                // Email sent successfully
                console.log("OTP email sent");
              }
            });

            console.log(OTP);

            const newOtp = new otp({ email: req.body.email, otp: OTP });
            const salt = await bcrypt.genSalt(10);
            newOtp.otp = await bcrypt.hash(newOtp.otp, salt);
            const result = await newOtp.save();

            res.status(200).render("OTPpage", { data: result });
          }
        } else {
          req.flash("notice", "user Blocked");
          res.status(200).redirect("/loginWithOtp");
        }
      } else {
        req.flash("notice", "user not found");
        res.status(200).redirect("/loginWithOtp");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************Shirt page controller********************************************

  shirtpageload: async (req, res) => {
    try {
      const notice = req.flash("notice");
      const usersession = req.session.userid;
      const data = await collection.findOne({ email: usersession });
      const shirts = await product.find({});
      const cate = await category.find({});
      res
        .status(200)
        .render("products", {
          products: shirts,
          session: usersession,
          title: "Hi, " + data.name,
          session: usersession,
          notice: notice[0] || "",
          category: null,
          categories: cate,
          activeValue: null,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  shirtview: async (req, res) => {
    try {
      const productid = req.query.id;

      const usersession = req.session.userid;
      const sessiondata = await collection.findOne({ email: usersession });
      const data = await product.findById({ _id: productid });
      res
        .status(200)
        .render("viewproduct", { data: data, session: usersession });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  productsearch: async (req, res) => {
    try {
      const proname = req.body.pname;
      const usersession = req.session.userid;
      let productnamelower = proname.toLowerCase().replace(/\s/g, "");
      const data = await collection.findOne({ email: usersession });
      const cate = await category.find({});
      const product_data = await product.find({
        productnamelower: {
          $regex: ".*" + productnamelower + ".*",
          $options: "i",
        },
      });
      if (product_data.length === 0) {
        res.render("products", {
          products: null,
          session: usersession,
          title: "Hi, " + data.name,
          session: usersession,
          category: null,
          categories:cate
        });
      } else {
        const cat = product_data[0].category;
        const categories = product_data.map((product) => product.category);
        //  const productfindcat= await product.find({category:cat})
        const productfindcat = await product.find({
          category: cat,
          _id: { $nin: product_data.map((item) => item._id) },
        });
        // const findcategory= await category.find({categoryName:categories})
        // const similarproduct= await product.find({category:findcategory.categoryName})
        // console.log("similar " + similarproduct);
        res.render("products", {
          products: product_data,
          session: usersession,
          title: "Hi, " + data.name,
          session: usersession,
          category: productfindcat,
          categories:cate
        });
      }

      // const categoryall= await product.find({category:product_data.category})
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  //***********************************working controller********************************************

  SignupotpSend: async (req, res) => {
    try {
      const finduser = await collection.findOne({
        email: req.body.signupemail,
      });

      if (finduser) {
        req.flash("notice", "User email Already Exists");
        res.status(200).redirect("/login");
      } else {
        console.log(req.body.signupemail);
        const SignUpEmail = req.body.signupemail;
        const OTP = otpGenerator.generate(4, {
          digits: true,
          alphabets: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        console.log(OTP);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "ajasmaprince@gmail.com",
            pass: "ydkvwkujlbgrcdjo",
          },
        });
        var mailOptions = {
          from: "ajasmaprince@gmail.com",
          to: SignUpEmail.email,
          subject: "OTP VERIFICATION",
          text: "PLEASE ENTER THE OTP FOR LOGIN " + OTP,
        };
        transporter.sendMail(mailOptions, function (error, info) {});
        console.log(OTP);
        const Otp = new otp({ email: req.body.signupemail, otp: OTP });
        const salt = await bcrypt.genSalt(10);
        Otp.otp = await bcrypt.hash(Otp.otp, salt);
        const result = await Otp.save();

        res.status(200).render("SignupOtpPage", { data: result });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  SignUpotpVerify: async (req, res) => {
    try {
      const SignUpemail = req.body.SignUpemail;
      const SignUpotp = req.body.otp;
      const otpHolder = await otp.findOne({ email: SignUpemail });

      if (otpHolder) {
        const validuser = await bcrypt.compare(SignUpotp, otpHolder.otp);
        if (validuser) {
          const otpdelete = await otp.deleteMany({ email: SignUpemail });
          res.status(200).render("usersignup", { data: SignUpemail });
        } else {
          console.log("otp wrong");
          const finduser = await otp.findOne({ email: SignUpemail });
          res
            .status(200)
            .render("SignupOtpPage", {
              data: finduser,
              notice: " Wrong OTP , Re-enter OTP",
            });
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP");
        res.status(200).redirect("/loginWithOtp");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  newuser: async (req, res) => {
    try {
      const data = new collection({
        name: req.body.signupName,
        email: req.body.signupEmail,
        phone: req.body.signupPhone,
        password: req.body.signupPassword,
        admin: 0,
      });
      let userdata = await data.save();
      res.redirect("/");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  SignUpotpresend: async (req, res) => {
    try {
      const emailID = req.query.id;
      console.log(emailID);
      const userdata = await otp.findOne({ email: emailID });

      const existingOTP = await otp.findOne({ email: emailID });
      // If there is an existing OTP, update it and resend
      if (existingOTP) {
        const OTP = otpGenerator.generate(4, {
          digits: true,
          alphabets: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });

        const salt = await bcrypt.genSalt(10);
        existingOTP.otp = await bcrypt.hash(OTP, salt);
        await existingOTP.save();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "ajasmaprince@gmail.com",
            pass: "ydkvwkujlbgrcdjo",
          },
        });

        var mailOptions = {
          from: "ajasmaprince@gmail.com",
          to: existingOTP.email,
          subject: "OTP VERIFICATION",
          text: "PLEASE ENTER THE OTP FOR LOGIN: " + OTP,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            // Handle error sending email
          } else {
            // Email sent successfully
            console.log("OTP email sent");
          }
        });

        console.log(OTP);

        res.status(200).render("SignupOtpPage", { data: existingOTP });
      } else {
        // Generate a new OTP and save it
        const OTP = otpGenerator.generate(4, {
          digits: true,
          alphabets: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "ajasmaprince@gmail.com",
            pass: "ydkvwkujlbgrcdjo",
          },
        });

        var mailOptions = {
          from: "ajasmaprince@gmail.com",
          to: existingOTP.email,
          subject: "OTP VERIFICATION",
          text: "PLEASE ENTER THE OTP FOR LOGIN: " + OTP,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            res.status(500).send({ success: false, msg: error.message });
          } else {
            // Email sent successfully
            console.log("OTP email sent");
          }
        });

        console.log(OTP);

        const newOtp = new otp({ email: req.body.email, otp: OTP });
        const salt = await bcrypt.genSalt(10);
        newOtp.otp = await bcrypt.hash(newOtp.otp, salt);
        const result = await newOtp.save();

        res.status(200).render("login", { data: result });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************About controller********************************************

  about: async (req, res) => {
    try {
      res.status(200).render("about");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************contact us controller********************************************

  contactus: async (req, res) => {
    try {
      res.status(200).render("contact");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //***********************************Logout controller********************************************

  logout: (req, res) => {
    try {
      req.session.destroy();
      res.status(200).render("homepage", { title: "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  createOrder: async (req, res) => {
    try {
      console.log("start stock");
      const user = req.session.userid;
      let amount = parseInt(req.body.amount) * 100;
      let flag = await checkStock(user);
      if (flag == 0) {
        const options = {
          amount: amount,
          currency: "INR",
          receipt: "ajasmaprince@gmail.com",
        };
        razorpayInstance.orders.create(options, (err, order) => {
          if (!err) {
            res.status(200).send({
              success: true,
              msg: "Order Created",
              amount: amount,
              key_id: RAZORPAY_ID_KEY,
              contact: "8891645456",
              name: "Ajas M A",
              email: "ajasmaprince@gmail.com",
              message: true,
            });
          } else {
            res.status(400).send({
              message: true,
              success: false,
              msg: "Something went wrong!",
            });
          }
        });
      } else {
        res
          .status(200)
          .send({ message: false, msg: "Some products are out of Stock" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  useraccount: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      res
        .status(200)
        .render("userAccountDetails", {
          data: userdetails,
          title: "Hi, " + userdetails.name,
          session: req.session.userid,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userAccountEdit: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      res
        .status(200)
        .render("userAccountEdit", {
          data: userdetails,
          title: "Hi, " + userdetails.name,
          session: req.session.userid,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userEditSucess: async (req, res) => {
    try {
      const user = await collection.findOne({ email: req.session.userid });
      dataobj = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
      };
      const userfind = await collection.findByIdAndUpdate(
        { _id: user._id },
        { $set: dataobj },
        { new: true }
      );
      res.status(200).redirect("/useraccount");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  uploadprofilephoto: async (req, res) => {
    try {
      let userId = req.session.userid;
      const userdetails = await collection.findOne({ email: userId });

      upload.single("profilePhoto")(req, res, async (err) => {
        if (err) {
          console.log(err);
          req.session.message = {
            type: "error",
            message: "Failed to upload profile photo",
          };
          res.status(200).redirect("/profile-view");
          // return res.status(500).json({ error: 'Failed to upload profile photo' });
        }

        const filename = req.file.filename;

        await collection
          .findByIdAndUpdate(userdetails._id, {
            $set: { userprofile: filename },
          })
          .then(() => {
            res.json({ status: true });
          });
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  forgetpassword: async (req, res) => {
    try {
      const userfind = await collection.findOne({ email: req.session.userid });
      const notice = req.flash("notice");
      res
        .status(200)
        .render("forgetpassword", {
          session: req.session.userid,
          title: "Hi, " + userfind.name,
          notice: notice[0] || "",
        });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  forgetOTPpage: async (req, res) => {
    try {
      const userdata = await collection.findOne({ email: req.body.email });
      if (req.session.userid === req.body.email) {
        if (userdata) {
          if (userdata.block === 0) {
            const OTP = otpGenerator.generate(4, {
              digits: true,
              alphabets: false,
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
              specialChars: false,
            });
            console.log(OTP);
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "ajasmaprince@gmail.com",
                pass: "ydkvwkujlbgrcdjo",
              },
            });
            var mailOptions = {
              from: "ajasmaprince@gmail.com",
              to: userdata.email,
              subject: "OTP VERIFICATION",
              text: "PLEASE ENTER THE OTP FOR LOGIN " + OTP,
            };
            transporter.sendMail(mailOptions, function (error, info) {});
            console.log(OTP);
            const Otp = new otp({ email: req.body.email, otp: OTP });
            const salt = await bcrypt.genSalt(10);
            Otp.otp = await bcrypt.hash(Otp.otp, salt);
            const result = await Otp.save();

            res
              .status(200)
              .render("ForgetOTPpage", {
                data: result,
                session: req.session.userid,
                title: "Hi, " + userdata.name,
              });
          } else {
            console.log("user not found");
            req.flash("notice", "user not found");
            res.status(200).redirect("/forgetpassword");
          }
        } else {
          req.flash("notice", "user not found");
          res.status(200).redirect("/forgetpassword");
        }
      } else {
        req.flash("notice", "user Email-Id not Matching");
        res.status(200).redirect("/forgetpassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  ForgetotpVerify: async (req, res) => {
    try {
      const useremail = req.body.email;
      const userotp = req.body.otp;
      const userdata = await collection.findOne({ email: req.body.email });
      const otpHolder = await otp.findOne({ email: useremail });

      if (otpHolder) {
        const validuser = await bcrypt.compare(userotp, otpHolder.otp);
        console.log(validuser);
        if (validuser) {
          req.session.userid = req.body.email;
          const data = await collection.findOne({ email: req.session.userid });
          await otp.deleteMany({ email: req.session.userid });
          res.render("newpassword", {
            session: req.session.userid,
            title: "Hi, " + userdata.name,
          });
        } else {
          console.log("otp wrong");
          console.log(useremail);
          const finduser = await otp.findOne({ email: useremail });

          res
            .status(200)
            .render("ForgetOTPpage", {
              data: finduser,
              notice: " Wrong OTP , Re-enter OTP",
            });
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP");
        res.status(200).redirect("/forgetpassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  passwordChanged: async (req, res) => {
    try {
      console.log(req.session.userid);
      console.log(req.body.password);
      const newpass = req.body.password;
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      if (userdetails.password == newpass) {
        req.flash("notice", "Enter password is old password");
        res.redirect("/forgetpassword");
      } else {
        const change = await collection.findByIdAndUpdate(userdetails._id, {
          $set: { password: newpass },
        });
        req.session.destroy();
        res.render("login", {
          notice: "password change successfully , Login Again",
        });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  checkvalid_Coupon: async (req, res) => {
    try {
      let couponCode = req.body.code;
      let user = req.session.userid;
      const userdetails = await collection.findOne({ email: user });
      let orderAmount = req.body.amount;
      const coupon = await couponModel.findOne({ couponCode: couponCode });
      if (coupon) {
        if (!coupon.usedUsers.includes(userdetails._id)) {
          if (orderAmount >= coupon.minimumAmount) {
            res.send({ msg: "1", discount: coupon.couponAmount });
          } else {
            res.send({
              msg: "2",
              message: "Coupon is not applicable for this price",
            });
          }
        } else {
          res.send({ msg: "2", message: "Coupon already used" });
        }
      } else {
        res.send({ msg: "2", message: "Coupon Code Invalid" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  walletload: async (req, res) => {
    try {
      const user = await collection.findOne({ email: req.session.userid });
      const walletdetails = await walletModel.findOne({ userid: user._id });
      res.render("walletpage", { session: user, wallet: walletdetails });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  cancelOrder: async (req, res) => {
    const userData = req.session.userid;
    const userfind = await collection.findOne({ email: userData });
    const { id } = req.body;

    try {
      let order = await orderModel.findById(id);
      if (order.PaymentMethod != "COD") {
        const userwallet = await walletModel.findOne({ userid: userfind._id });
        if (userwallet) {
          await walletModel.findByIdAndUpdate(
            userwallet._id,
            {
              $inc: { balance: order.totalAmount },
              $push: {
                orderDetails: {
                  orderid: id,
                  amount: order.totalAmount,
                  type: "Added",
                },
              },
            },
            { new: true }
          );
        } else {
          let wallet = new walletModel({
            userid: userfind._id,
            balance: order.totalAmount,
            orderDetails: [
              {
                orderid: id,
                amount: order.totalAmount,
                type: "Added",
              },
            ],
          });
          await wallet.save();
        }
        order = await orderModel.findByIdAndUpdate(
          id,
          { paymentStatus: "Refund" },
          { new: true }
        );
      }
      for (const pro of order.products) {
        await product.findByIdAndUpdate(
          pro.productid,
          { $inc: { quantity: pro.quantity } },
          { new: true }
        );
      }
      order = await orderModel.findByIdAndUpdate(
        id,
        { paymentStatus: "Refund", status: "Cancelled" },
        { new: true }
      );
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  returnRequest: async (req, res) => {
    const { id } = req.body;
    try {
      let order = await orderModel.findByIdAndUpdate(
        id,
        { status: "Return Requested" },
        { new: true }
      );
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = user;

let checkStock = async (user) => {
  let flag = 0;
  const Cart = await cart
    .findOne({ userID: user })
    .populate("products.productid");
  //   console.log(Cart);
  for (const products of Cart.products) {
    const pro = await product.findOne({ _id: products.productid });
    console.log(pro);
    if (products.Cartquantity > pro.quantity) {
      flag = 1;
      break;
    }
  }
  console.log(flag);
  return flag;
};
