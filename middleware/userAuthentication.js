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
      res.status(404).render("error", { error: error.message });
    }
  },

  isLogin: async (req, res, next) => {
    try{
      if (req.session.userid) {
        next();
      } else {
        res.redirect("/login");
      }
    }catch(error){
      res.status(404).render("error", { error: error.message });
    }
   
  },

  
  isBlocked: async (req, res, next) => {
    try {
      const user = await collection.findOne({ email: req.session.userid });
      if (user.block == 1) {
        req.session.destroy();
        res.redirect('/login');
      } else {
        next();
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
};

module.exports = userAuth;
