const collection = require("../models/userModel");

const userAuth = {
  isLogout: async (req, res, next) => {
    try {
      if (req.session.userid) {
        res.redirect("/");
      } else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  isLogin: async (req, res, next) => {
    if (req.session.userid) {
      next();
    } else {
      res.redirect("/login");
    }
  },

  
  isBlocked: async (req, res, next) => {
    try {
      const user = await collection.findOne({ email: req.session.userid });
      if (user.block == 1) {
        req.session.destroy();
        res.render("homepage", { notice: "User Account Blocked" });
      } else {
        next();
      }
    } catch (error) {
      res.status(500).send({ success: false, msg: error.message });
    }
  },
};

module.exports = userAuth;
