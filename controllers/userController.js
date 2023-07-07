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
const couponModel = require("../models/couponModel");
const walletModel = require("../models/walletModel");
const multerhelper = require("../helper/multerConfig");

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const user = {
  // Render the homepage with user data if logged in, otherwise render without user data
  homepage: async (req, res) => {
    try {
      const data = await collection.findOne({ email: req.session.userid });
      const pro = await product.find({ isDelete: false }).limit(4);
      if (req.session.userid) {
        res.status(200).render("homepage", {
          title: "Hi, " + data.name,
          session: req.session.userid,
          products: pro,
        });
      } else {
        res.status(200).render("homepage", { products: pro });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Render the homepage with user data
  home: async (req, res) => {
    const { userid } = req.session;
    let userdata = await collection.findOne({ email: userid });
    const pro = await product.find({ isDelete: false }).limit(4);
    res.status(200).render("homepage", {
      title: "Hi, " + userdata.name,
      session: userid,
      products: pro,
    });
  },

  // Render the login page with an optional notice message
  login: (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("login", { notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
  userblock: (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("login", { notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Handle user login request
  userlogin: async (req, res) => {
    try {
      let userdata = await collection.findOne({ email: req.body.loginEmail });
      if (userdata) {
        if (userdata.block === 0) {
          if (userdata.password === req.body.loginPassword) {
            req.session.userid = req.body.loginEmail;
            res.redirect("/home");
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

  // Render the user profile page
  userprofile: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      res.status(200).render("userDashboard", {
        session: req.session.userid,
        title: "Hi, " + userdetail.name,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Render the user order history page with user data, addresses, and orders
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

      res.status(200).render("userorder", {
        session: req.session.userid,
        title: "Hi, " + userdetail.name,
        address: addressdetails,
        orders: orders,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Render the user address page with user data and addresses
  userAddress: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      const addressdetails = await useraddress.find({ userid: userdetail._id });
      res.status(200).render("userAddress", {
        session: req.session.userid,
        title: "Hi, " + userdetail.name,
        address: addressdetails,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Render the page to add a new user address
  userAddAddress: async (req, res) => {
    try {
      const userdetail = await collection.findOne({
        email: req.session.userid,
      });
      res.status(200).render("userAddAddress", {
        session: req.session.userid,
        title: "Hi, " + userdetail.name,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Render the page to edit a user address
  edituserAddress: async (req, res) => {
    try {
      const user = req.query.id;
      const addressdetail = await useraddress.findOne({ _id: user });

      res.status(200).render("userEditAddress", {
        session: req.session.userid,
        address: addressdetail,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Update user address data
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

  // Add a new user address to the database
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

  // Delete a user address from the database
  deleteAddress: async (req, res) => {
    try {
      const addressid = req.query.id;
      const del = await useraddress.deleteOne({ _id: addressid });
      res.status(200).redirect("/userAddress");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Renders the checkout page with user details, address details, products in the cart, available coupons, and wallet balance.
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
      res.status(200).render("checkout", {
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

  //Renders the page to add a new address during checkout.
  addaddresscheckout: async (req, res) => {
    try {
      res.status(200).render("addaddress", { session: req.session.userid });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Saves the new address provided by the user during checkout.
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

  //Processes the user's order by checking product availability, creating a new order,updating product quantities, and
  //updating the user's wallet balance if the payment method is "Wallet."
  placeOrder: async (req, res) => {
    try {
      // let flag = 0,
      //   stockOut = [];
      const address = req.body.address;
      const total = req.body.total;
      const paymentMethod = req.body.paymentmethod;
      const user = req.session.userid;
      const userdetails = await collection.findOne({ email: user });
      const couponusedcode = req.body.couponCode;
      const couponamount = req.body.couponAmount;
      let paymentStatus;
      if (paymentMethod === "Razorpay" || paymentMethod === "Wallet") {
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Unpaid";
      }
      let flag = await checkStock(user);

      const cartdetail = await cart
        .findOne({ userID: user })
        .populate("products.productid");

      // cartdetail.products.forEach(async (productdetail) => {
      //   const pro = await product.findOne({ _id: productdetail.productid });
      //   if (productdetail.Cartquantity > pro.quantity) {
      //     flag = 1;
      //     stockOut.push({ name: pro.productname, available: pro.quantity });
      //   }
      // });

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

  //Renders the order completion page after a successful order.
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
      res.status(200).render("orderComplete", {
        session: req.session.userid,
        order: cartdetails,
        title: "Hi, " + userdetails.name,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the order tracking page.
  trackorder: async (req, res) => {
    try {
      res.status(200).render("trackorder", { session: req.session.userid });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the detailed view of a specific user order.
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
      res.status(200).render("userorderDetails", {
        session: req.session.userid,
        orderDetail: orderdetails,
        title: "Hi, " + userfind.name,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the user registration page.
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

  // Checks if a user with the provided email already exists. If not, it sends an OTP to the user's email for verification.
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

  //Handles user registration with OTP verification. Creates a new user if the OTP matches.
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

  //Renders the login page with OTP.
  loginWithOtp: (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("loginWithOtp", { notice: notice[0] });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the OTP verification page during login.
  OTPpage: (req, res) => {
    try {
      res.status(200).render("OTPpage");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Sends an OTP to the user's email for login.
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

  //Verifies the OTP provided by the user during login and redirects to the homepage if successful.
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
          const pro = await product.find({ isDelete: false }).limit(4);
          await otp.deleteMany({ email: req.session.userid });
          res.status(200).render("homepage", {
            title: "Hi, " + data.name,
            session: req.session.userid,
            products: pro,
          });
        } else {
          console.log("otp wrong");
          console.log(useremail);
          const finduser = await otp.findOne({ email: useremail });

          res.status(200).render("OTPpage", {
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

  //Renders the login page with OTP and displays a notice if there is any.
  otpload: (req, res) => {
    try {
      const title = req.flash("notice");
      res.status(200).render("loginWithOtp", { notice: title[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Handles the timeout case when the OTP expires.
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

  //Resends the OTP to the user's email.
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
                res.status(404).render("error", { error: error.message });
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

  // Loads the product page, displaying shirts and categories for the logged-in user.
  shirtpageload: async (req, res) => {
    try {
      const notice = req.flash("notice");
      const usersession = req.session.userid;
      const data = await collection.findOne({ email: usersession });
      const shirts = await product.find({ isDelete: false });
      const cate = await category.find({});
      res.status(200).render("products", {
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

  //Displays the details of a specific shirt product.
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

  //Performs a search for products based on the provided product name.
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
          categories: cate,
        });
      } else {
        const cat = product_data[0].category;
        const categories = product_data.map((product) => product.category);
        const productfindcat = await product.find({
          category: cat,
          _id: { $nin: product_data.map((item) => item._id) },
        });
        res.render("products", {
          products: product_data,
          session: usersession,
          title: "Hi, " + data.name,
          session: usersession,
          category: productfindcat,
          categories: cate,
        });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Sends an OTP to the user's email during the signup process.
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
          to: SignUpEmail,
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

  // Verifies the OTP entered by the user during the signup process.
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
          res.status(200).render("SignupOtpPage", {
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

  //Creates a new user account and saves it to the database.
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

  //Resends the OTP during the signup process.
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

  //Renders the "About" page.
  about: async (req, res) => {
    try {
      const {userid}=req.session
      if(userid){
        const user=await collection.findOne({email:userid})
        res.status(200).render("about",{session:userid,title:"Hi "+user.name});
      }else{
        res.status(200).render("about");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the "Contact Us" page.
  contactus: async (req, res) => {
    try {
      const {userid}=req.session
      if(userid){
        const user=await collection.findOne({email:userid})
        res.status(200).render("contact",{session:userid,title:"Hi "+user.name});
      }else{
        res.status(200).render("contact");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Logs out the user by destroying the session.
  logout: (req, res) => {
    try {
      req.session.destroy();
      res.status(200).redirect("/");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Creates an order for a product, checking stock availability.
  createOrder: async (req, res) => {
    try {
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

  //Renders the user's account details page.
  useraccount: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      res.status(200).render("userAccountDetails", {
        data: userdetails,
        title: "Hi, " + userdetails.name,
        session: req.session.userid,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the user account edit page.
  userAccountEdit: async (req, res) => {
    try {
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      res.status(200).render("userAccountEdit", {
        data: userdetails,
        title: "Hi, " + userdetails.name,
        session: req.session.userid,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Updates the user's account information after editing.
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

  //Handles uploading a profile photo for the user.
  uploadprofilephoto: async (req, res) => {
    try {
      let userId = req.session.userid;
      const userdetails = await collection.findOne({ email: userId });

      multerhelper.profileImageUpload.single("profilePhoto")(
        req,
        res,
        async (err) => {
          if (err) {
            console.log(err);
            req.session.message = {
              type: "error",
              message: "Failed to upload profile photo",
            };
            res.status(200).redirect("/profile-view");
          }

          const filename = req.file.filename;

          await collection
            .findByIdAndUpdate(userdetails._id, {
              $set: { userprofile: filename },
            })
            .then(() => {
              res.json({ status: true });
            });
        }
      );
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  //Renders the "Forget Password" page.
  userChangePassword: async (req, res) => {
    try {
      const userfind = await collection.findOne({ email: req.session.userid });
      const notice = req.flash("notice");
      res.status(200).render("userChangePassword", {
        session: req.session.userid,
        title: "Hi, " + userfind.name,
        notice: notice[0] || "",
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // Renders the OTP page during the password reset process.
  userPasswordChangeOTPpage: async (req, res) => {
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

            res.status(200).render("userPasswordChangeOTPpage", {
              data: result,
              session: req.session.userid,
              title: "Hi, " + userdata.name,
            });
          } else {
            console.log("user not found");
            req.flash("notice", "user not found");
            res.status(200).redirect("/userChangePassword");
          }
        } else {
          req.flash("notice", "user not found");
          res.status(200).redirect("/userChangePassword");
        }
      } else {
        req.flash("notice", "user Email-Id not Matching");
        res.status(200).redirect("/userChangePassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // This function handles the verification of the OTP sent during the forget password process.
  UserChangePasswordVerify: async (req, res) => {
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
          res.render("UserNewPassword", {
            session: req.session.userid,
            title: "Hi, " + userdata.name,
          });
        } else {
          console.log("otp wrong");
          console.log(useremail);
          const finduser = await otp.findOne({ email: useremail });

          res.status(200).render("userPasswordChangeOTPpage", {
            data: finduser,
            notice: " Wrong OTP , Re-enter OTP",
          });
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP");
        res.status(200).redirect("/userChangePassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //This function is responsible for changing the user's password after verifying the OTP.
  UserPasswordChanged: async (req, res) => {
    try {
      console.log(req.session.userid);
      console.log(req.body.password);
      const newpass = req.body.password;
      const userdetails = await collection.findOne({
        email: req.session.userid,
      });
      if (userdetails.password == newpass) {
        req.flash("notice", "Enter password is old password");
        res.redirect("/userChangePassword");
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

  //This function checks the validity of a coupon code and its applicability to the user's order.
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

  //This function retrieves and displays the user's wallet details.
  walletload: async (req, res) => {
    try {
      const user = await collection.findOne({ email: req.session.userid });
      const walletdetails = await walletModel.findOne({ userid: user._id });
      res.render("walletpage", { session: user, wallet: walletdetails ,title:"Hi "+user.name});
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //This function handles the cancellation of an order and initiates a refund if applicable.
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

  //This function handles the request for returning an order.
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

  //Renders the "Forget Password" page.
  forgetPassword: async (req, res) => {
    try {
      const notice = req.flash("notice");
      res.status(200).render("forgetChangePassword", {
        notice: notice[0] || "",
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // Renders the OTP page during the password reset process.
  forgetPasswordChangeOTPpage: async (req, res) => {
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

          res.status(200).render("forgetPasswordChangeOTPpage", {
            data: result,
          });
        } else {
          console.log("user not found");
          req.flash("notice", "user not found");
          res.status(200).redirect("/forgetPassword");
        }
      } else {
        req.flash("notice", "user not found");
        res.status(200).redirect("/forgetPassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // This function handles the verification of the OTP sent during the forget password process.
  forgetChangePasswordVerify: async (req, res) => {
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
          res.render("forgetNewPassword", { email: useremail });
        } else {
          console.log("otp wrong");
          console.log(useremail);
          const finduser = await otp.findOne({ email: useremail });

          res.status(200).render("forgetPasswordChangeOTPpage", {
            data: finduser,
            notice: " Wrong OTP , Re-enter OTP",
          });
        }
      } else {
        console.log("expire");
        req.flash("notice", "You used an Expried OTP");
        res.status(200).redirect("/forgetPassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //This function is responsible for changing the user's password after verifying the OTP.
  forgetPasswordChanged: async (req, res) => {
    const { email } = req.body;
    try {
      const newpass = req.body.password;
      const userdetails = await collection.findOne({
        email: email,
      });
      if (userdetails.password == newpass) {
        req.flash("notice", "Enter password is old password");
        res.redirect("/forgetPassword");
      } else {
        const change = await collection.findByIdAndUpdate(userdetails._id, {
          $set: { password: newpass },
        });
        req.session.destroy();
        res.render("login", {
          notice: "password change successfully , Login Again",
          noticeType: "success",
        });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Resends the OTP to the user's email.
  forgetOTPResend: async (req, res) => {
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
                res.status(404).render("error", { error: error.message });
              } else {
                // Email sent successfully
                console.log("OTP email sent");
              }
            });

            console.log(OTP);

            res
              .status(200)
              .render("forgetPasswordChangeOTPpage", { data: existingOTP });
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

            res
              .status(200)
              .render("forgetPasswordChangeOTPpage", { data: result });
          }
        } else {
          req.flash("notice", "user Blocked");
          res.status(200).redirect("/forgetPassword");
        }
      } else {
        req.flash("notice", "user not found");
        res.status(200).redirect("/forgetPassword");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
};

module.exports = user;

//check product stock
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
