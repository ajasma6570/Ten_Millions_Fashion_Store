const mongoose = require("mongoose");
const product = require("../models/productModel");
const cart = require("../models/cartModel");
const collection = require("../models/userModel");

const cartController = {

//This function retrieves the user's cart data and renders the cart page with the cart items and user details.
  cartview: async (req, res) => {
    try {
      const userData = req.session.userid;

      const userfind = await collection.findOne({ email: userData });

      const cartData = await cart
        .findOne({ userID: userData })
        .populate("products.productid");
      res.status(200).render("cart", {
        cart: cartData,
        userdata: userfind,
        session: userData,
        title: "Hi, " + userfind.name,
      });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function adds a product to the user's cart. It checks if the product is already in the cart, and if so, it displays a flash message
  addtocart: async (req, res) => {
    try {
      const userdata = req.session.userid;
      const productdata = req.query.id;

      const cartdetail = await cart.findOne({ userID: userdata });

      if (cartdetail) {
        const proExist = cartdetail.products.findIndex((product) =>
          product.productid.equals(productdata)
        );

        if (proExist != -1) {
          let userid = new mongoose.Types.ObjectId(userdata._id);
          let proid = new mongoose.Types.ObjectId(productdata);
          const products = await cart.aggregate([
            { $match: { userID: userid } },
            { $group: { _id: "$products" } },
            { $unwind: "$_id" },
            { $match: { "_id.productid": proid } },
          ]);

          req.flash("notice", "Already added to cart");
          return res.status(200).redirect("/shirts");
        } else {
          const productheck = await cart.findOne({ _id: productdata });

          await cart.findOneAndUpdate(
            { userID: userdata },
            { $push: { products: { productid: productdata, quantity: 1 } } },
            { new: true }
          );
        }
      } else {
        const addcart = new cart({
          userID: userdata,
          products: [{ productid: productdata, quantity: 1 }],
        });
        await addcart.save();
      }

      return res.status(200).redirect("/cart");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function deletes a cart item from the user's cart based on the product ID.
  deleteCartItem: async (req, res) => {
    try {
      const proid = req.query.id;
      const userdata = req.session.userid;

      await cart.updateOne(
        { userID: userdata },
        { $pull: { products: { _id: proid } } }
      );

      res.status(200).redirect("/cart");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function increments the quantity of a product in the cart. It checks if the quantity can be incremented based on the available stock for that product.
  increment_product: async (req, res) => {
    try {
      const proid = req.body.proID;

      const Quantity = req.body.quantity;

      const q1 = parseInt(Quantity) + 1;
      const checkQuatity = await product.findById({ _id: proid });
      const userid = req.session.userid;

      if (checkQuatity.quantity >= q1) {
        const productupdate = await cart.updateOne(
          { userID: userid, "products.productid": proid },
          { $inc: { "products.$.Cartquantity": 1 } }
        );
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

//This function decrements the quantity of a product in the cart. It checks if the quantity can be decremented without going below 1.
  decrement_product: async (req, res) => {
    try {
      const proid = req.body.proID;

      const Quantity = req.body.quantity;

      const q1 = parseInt(Quantity) - 1;
      const userid = req.session.userid;

      if (q1 > 0) {
        const productupdate = await cart.updateOne(
          { userID: userid, "products.productid": proid },
          { $inc: { "products.$.Cartquantity": -1 } }
        );
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },
};

module.exports = cartController;
