const adminAuth = {
  isLogout: (req, res, next) => {
    try {
      if (req.session.adminid) {
        res.status(200).redirect("/admin/dashboard");
      } else {
        next();
      }
    } catch (error) {
      res.status(500).send({ success: false, msg: error.message });
    }
  },

  isLogin: async (req, res, next) => {
    try {
      if (req.session.adminid) {
        next();
      } else {
        res.status(200).redirect("/admin");
      }
    } catch (error) {
      res.status(500).send({ success: false, msg: error.message });
    }
  },
};

module.exports = adminAuth;
