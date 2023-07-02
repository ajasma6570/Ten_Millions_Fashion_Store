const product = require("../models/productModel");
const category = require("../models/categoriesmodel");
const user = require("../models/userModel");
const orderModel = require("../models/orderModel");
const walletModel = require("../models/walletModel");

const admin = {
  // This section handles the login functionality for the admin.
  admin: (req, res) => {
    try {
      res.status(200).render("login");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the dashboard homepage.
  homepage: (req, res) => {
    try {
      res.status(200).render("dashboard");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Fetches data related to orders, products, categories, and revenue to display on the admin dashboard.
  dashboard: async (req, res) => {
    try {
      const details = await orderModel.aggregate([
        { $match: { status: "Delivered" } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]);

      const TotalSales = details[0].totalSales;
      const ordercount = await orderModel.find({}).count();
      const productcount = await product.find({}).count();
      const categorycount = await category.find({}).count();

      const salesData = await orderModel.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 7 },
      ]);

      const data = [];
      const date = [];

      for (const totalRevenue of salesData) {
        data.push(totalRevenue.totalRevenue);
        const monthName = new Date(totalRevenue.date + "-01").toLocaleString(
          "en-US",
          { month: "long" }
        );
        date.push(monthName);
      }

      const monthly = data[0];
      const current = await orderModel.aggregate([
        {
          $match: {
            orderDate: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
              $lt: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                1
              ),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);
      const orders = await orderModel.find({}).populate("userid").exec();
      res
        .status(200)
        .render("dashboard", {
          revenue: TotalSales,
          order: ordercount,
          product: productcount,
          category: categorycount,
          orders: orders,
          current: current,
          monthlysale: monthly,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Handles the login authentication for the admin.
  adminlogin: async (req, res) => {
    try {
      let admindata = await user.findOne({
        $and: [{ email: req.body.adminEmail }, { admin: 1 }],
      });
      if (admindata) {
        if (admindata.password === req.body.adminPassword) {
          req.session.adminid = admindata._id;

          const details = await orderModel.aggregate([
            { $match: { paymentStatus: "Paid" } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
          ]);
          res.redirect("/admin/dashboard");
        } else {
          res.status(200).render("login", { notice: "password incorrect" });
        }
      } else {
        res.status(200).render("login", { notice: "user not found" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Renders the list of products and shows a flash message if there's a notice.
  productList: async (req, res) => {
    try {
      const products = await product.find({isDelete: false });
      const notice = req.flash("notice");
      res
        .status(200)
        .render("products", { product: products, notice: notice[0] || "" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the page to add a new product and also fetches the list of categories.
  addProductpage: async (req, res) => {
    try {
      const categorylist = await category.find({ list: { $ne: 1 } });
      const notice = req.flash("notice");
      res
        .status(200)
        .render("addproduct", {
          category: categorylist,
          notice: notice[0] || "",
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Handles the addition of a new product to the database.
  addproducts: async (req, res) => {
    try {
      if (req.error) {
        req.flash("notice", "Image validation faild. Check image format");
        return res.redirect("/admin/addproduct");
      }
      const pname = req.body.productname;
      let productnamelower = pname.toLowerCase().replace(/\s/g, "");

      const arrImages = [];
      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          arrImages.push(req.files[i].filename);
        }
      }

      const existcategory = await product.findOne({
        productnamelower: productnamelower,
      });

      if (existcategory) {
        req.flash("notice", "Product Name Already Exist");
        res.status(200).redirect("/admin/addproduct");
      } else {
        const newproduct = new product({
          productname: req.body.productname,
          productnamelower: productnamelower,
          category: req.body.categoryname,
          brand: req.body.brand,
          quantity: req.body.quantity,
          price: req.body.price,
          description: req.body.description,
          productimage: arrImages,
        });

        await newproduct.save();
        res.status(200).redirect("/admin/products");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the edit page for a product.
  editproduct: async (req, res) => {
    try {
      const userid = req.query.id;
      const productdata = await product.findById({ _id: userid });
      const categorylist = await category.find({ list: { $ne: 1 } });
      res
        .status(200)
        .render("editproduct", {
          productdata: productdata,
          category: categorylist,
          activeValue: productdata.category,
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Handles the update of a product with new information.
  updateProduct: async (req, res) => {
    try {
      if (req.error) {
        req.flash("notice", "Image validation faild. Check image format");
        return res.redirect("/admin/products");
      }

      let dataobj;
      const arrImages = [];

      if (req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          arrImages[i] = req.files[i].filename;
        }

        const existingProduct = await product.findById(req.body.id);
        // Combine the existing images with the new images
        const combinedImages = existingProduct.productimage.concat(arrImages);
        dataobj = {
          productname: req.body.productname,
          category: req.body.categoryname,
          brand: req.body.brand,
          quantity: req.body.quantity,
          price: req.body.price,
          description: req.body.description,
          productimage: combinedImages,
        };
      } else {
        //  for if admin not updating the image
        dataobj = {
          productname: req.body.productname,
          category: req.body.categoryname,
          brand: req.body.brand,
          quantity: req.body.quantity,
          price: req.body.price,
          description: req.body.description,
        };
      }

      const product_data = await product.findByIdAndUpdate(
        { _id: req.body.id },
        { $set: dataobj },
        { new: true }
      );
      res.status(200).redirect("/admin/products");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Deletes a product from the database.
  deleteproduct: async (req, res) => {
    try {
      const {id} = req.query;
      await product.findByIdAndUpdate(id,{$set:{isDelete:"true"}})
      res.status(200).redirect("/admin/products");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Removes an image associated with a product.
  deleteimage: async (req, res) => {
    try {
      const id = req.body.proID;
      console.log("id is ");
      console.log(id);
      const prodetails = await product.findOne({ productimage: id });
      await product.updateOne(
        { productname: prodetails.productname },
        { $pull: { productimage: id } }
      );
      res.status(200).json({ message: "1" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
    //    res.redirect('/admin/updateproduct')
  },

  //Renders the list of categories.
  Categories: async (req, res) => {
    try {
      const noticed = req.flash("notice");
      const icons = req.flash("icon");
      const categorylist = await category.find({});
      res
        .status(200)
        .render("Categories", {
          category: categorylist,
          notice: noticed[0],
          icon: icons[0],
        });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Handles the addition of a new category to the database.
  addingCategory: async (req, res) => {
    try {
      const categoryName = req.body.categoryName;
      let categorylower = categoryName.toLowerCase().replace(/\s/g, "");
      const existcategory = await category.findOne({
        categoryLower: categorylower,
      });
      if (existcategory) {
        req.flash("notice", "Category Already Exist");
        res.status(200).redirect("/admin/addcategories");
      } else {
        const newcategory = new category({
          categoryName: req.body.categoryName,
          categoryLower: categorylower,
          categoryDescription: req.body.categoryDescription,
        });
        await newcategory.save();
        res.status(200).redirect("/admin/Categories");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Toggles the status of a category between listed and unlisted.
  listCategories: async (req, res) => {
    try {
      const categoryId = req.query.id;
      const categorydata = await category.findOne({ _id: categoryId });
      if (categorydata.list === 0) {
        const user = await category.updateOne(
          { _id: categoryId },
          { $set: { list: 1 } }
        );
        req.flash("notice", "Category unlisted");
        req.flash("icon", "error");
        res.status(200).redirect("/admin/Categories");
      } else {
        console.log(categorydata.list === 0);
        const user = await category.updateOne(
          { _id: categoryId },
          { $set: { list: 0 } }
        );
        req.flash("notice", "Category listed");
        req.flash("icon", "success");
        res.status(200).redirect("/admin/Categories");
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the edit page for a category.
  categoryedit: async (req, res) => {
    try {
      const categoryid = req.query.id;
      const categorys = await category.findOne({ _id: categoryid });
      res.status(200).render("editcategory", { categorydata: categorys });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Handles the update of a category with new information.
  editcategorydone: async (req, res) => {
    try {
      const data = {
        categoryName: req.body.categoryName,
        categoryDescription: req.body.categoryDescription,
      };
      const category_data = await category.findByIdAndUpdate(
        { _id: req.body.id },
        { $set: data },
        { new: true }
      );
      res.status(200).redirect("/admin/Categories");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Deletes a category from the database.
  deletecategory: async (req, res) => {
    try {
      const categoryid = req.query.id;
      await category.deleteOne({ _id: categoryid });
      res.status(200).redirect("/admin/Categories");
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the page to add a new category.
  addcategories: async (req, res) => {
    try {
      const notice = req.flash("notice");
      res
        .status(200)
        .render("addcategory", { notice: notice[0], icon: "error" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the list of users (excluding admin users).
  userlist: async (req, res) => {
    try {
      const userdata = await user.find({ admin: { $ne: 1 } });
      res.status(200).render("userslist", { user: userdata });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Blocks a user account.
  block_user: async (req, res) => {
    try {
      const id = req.query.id;

      const users = await user.findByIdAndUpdate(
        { _id: id },
        { $set: { block: 1 } }
      );
      if (users) {
        res.status(200).send({ message: "User blocked successfully" });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  // Unblocks a user account.
  unblock_user: async (req, res) => {
    try {
      const id = req.query.id;
      const userData = await user.findByIdAndUpdate(
        { _id: id },
        { $set: { block: 0 } }
      );
      if (userData) {
        res.status(200).send({ message: "User has been unblocked." });
      }
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the list of orders.
  orderlist: async (req, res) => {
    try {
      const orders = await orderModel.find({}).populate("userid").exec();
      res.status(200).render("orderlist", { orders: orders });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Renders the details of a specific order.
  orderdetails: async (req, res) => {
    try {
      const orderid = req.query.id;
      const orderdetails = await orderModel
        .findById({ _id: orderid })
        .populate("products.productid")
        .populate("address")
        .populate("userid")
        .exec();
      res.status(200).render("orderDetails", { orderDetail: orderdetails });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Updates the status of an order (for example, from pending to delivered).
  updateStatus: async (req, res) => {
    try {
      const orderid = req.body.orderid;
      console.log(orderid);

      const status = req.body.status;
      console.log(status);
      const findOrder = await orderModel.findById({ _id: orderid });
      console.log(findOrder);
      if (findOrder.PaymentMethod == "COD" && status == "Delivered") {
        const order_update = await orderModel.findByIdAndUpdate(
          { _id: orderid },
          { $set: { status: status, paymentStatus: "Paid" } }
        );

        if (order_update) {
          res.send({ message: "1" });
        } else {
          res.send({ message: "0" });
        }
      } else {
        const order_update = await orderModel.findByIdAndUpdate(
          { _id: orderid },
          { $set: { status: status } }
        );

        if (order_update) {
          res.send({ message: "1" });
        } else {
          res.send({ message: "0" });
        }
      }

      if (order_update) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  ////Handles the logout of admin.
  logout: (req, res) => {
    try {
      req.session.destroy();
      res.status(200).redirect('/admin')
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Fetches data related to products daily sales and display on the admin dashboard Sale statistics chart.
  fetchChartData: async (req, res) => {
    try {
      const salesData = await orderModel.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 7 },
      ]);

      const data = [];
      const date = [];
      for (const totalRevenue of salesData) {
        data.push(totalRevenue.totalRevenue);
      }

      for (const item of salesData) {
        date.push(item.date);
      }
      data.reverse();
      date.reverse();

      res.status(200).send({ data: data, date: date });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  //Fetches data related to products Monthly sales and display on the admin dashboard Monthly sale chart.
  chartData2: async (req, res) => {
    try {
      const salesData = await orderModel.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 7 },
      ]);

      const data = [];
      const date = [];

      for (const totalRevenue of salesData) {
        data.push(totalRevenue.totalRevenue);
        const monthName = new Date(totalRevenue.date + "-01").toLocaleString(
          "en-US",
          { month: "long" }
        );
        date.push(monthName);
      }
      data.reverse();
      date.reverse();
      res.status(200).json({ data: data, date: date });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  ////Fetches data related to Category wise sales and display on the admin dashboard Category wise sale chart.
  categorywise: async (req, res) => {
    const orders = await orderModel
      .find({ status: "Delivered" })
      .populate("products.productid");
    const categoryTotals = {};

    orders.forEach((order) => {
      const orderDate = order.orderDate;
      const month = orderDate.getMonth() + 1; // Add +1 to the month to match the month numbering (January is 0)
      const year = orderDate.getFullYear();

      order.products.forEach((product) => {
        const { category, price } = product.productid;
        const quantity = product.quantity;
        const totalPrice = price * quantity;

        const key = `${month}-${year}`;

        if (categoryTotals.hasOwnProperty(key)) {
          if (categoryTotals[key].hasOwnProperty(category)) {
            categoryTotals[key][category] += totalPrice;
          } else {
            categoryTotals[key][category] = totalPrice;
          }
        } else {
          categoryTotals[key] = { [category]: totalPrice };
        }
      });
    });

    const labels = Object.keys(categoryTotals).sort();
    const datasets = {};

    // Get all unique categories
    const categories = new Set();
    labels.forEach((label) => {
      const categoryKeys = Object.keys(categoryTotals[label]);
      categoryKeys.forEach((category) => categories.add(category));
    });

    categories.forEach((category) => {
      const data = labels.map((label) => categoryTotals[label][category] || 0);
      datasets[category] = data;
    });

    function getMonthName(monthNumber) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return monthNames[monthNumber - 1];
    }

    const months = labels.map((label) => {
      const [month, year] = label.split("-");
      const monthNumber = parseInt(month);
      const monthName = getMonthName(monthNumber);
      return monthName;
    });

    const categoryNames = Array.from(categories);
    res
      .status(200)
      .json({ data: datasets, date: months, categoryname: categoryNames });
  },

  //Handles the Order return.
  approveReturn: async (req, res) => {
    const { id } = req.body;
    try {
      let order = await orderModel.findById(id);
      const userwallet = await walletModel.findOne({ userid: order.userid });
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
          userid: order.userid,
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
      for (const pro of order.products) {
        await product.findByIdAndUpdate(
          pro.productid,
          {
            $inc: { quantity: pro.quantity },
          },
          { new: true }
        );
      }
      order = await orderModel.findByIdAndUpdate(
        id,
        { paymentStatus: "Refund" },
        { new: true }
      );
      order = await orderModel.findByIdAndUpdate(
        id,
        { status: "Returned" },
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

  //Renders the product offer page.
  productOffer: async (req, res) => {
    const successmsg = req.flash("success")[0];
    const messageAlert = req.flash("title")[0];
    const products = await product.find({ offerprice: 0, isDelete: false });
    const offered = await product.find({ offerprice: { $ne: 0 } });
    res.render("productoffer", { products, offered, successmsg, messageAlert });
  },

  // Handles the product Offer of a product with new information..
  addProductOffer: async (req, res) => {
    const { productname, offerpercentage } = req.body;
    try {
      const pro = await product.findOne({ productname });
      if (pro.offerpercentage == 0) {
        const offerprice = Math.floor(
          pro.price - (pro.price * offerpercentage) / 100
        );
        const productUpdate = await product.updateOne(
          { productname },
          { $set: { offerpercentage, offerprice } }
        );
        req.flash("success", "Offer Applied");
        res.redirect("/admin/productoffer");
      } else {
        req.flash("title", "Product Already have an Offer");
        res.redirect("/admin/productOffer");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  //Removes the particular product offer.
  removeProductOffer: async (req, res) => {
    const { id } = req.body;
    try {
      const pro = await product.findByIdAndUpdate(id, {
        $set: { offerpercentage: 0, offerprice: 0 },
      });
      if (pro) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.send({ message: "0" });
    }
  },

  //Renders the category offer page.
  categoryOffer: async (req, res) => {
    const successmsg = req.flash("success")[0];
    const messageAlert = req.flash("title")[0];
    const categories = await category.find({ categorypercentage: { $eq: 0 } });
    const offered = await category.find({ categorypercentage: { $ne: 0 } });
    res.render("categoryoffer", {
      categories,
      offered,
      successmsg,
      messageAlert,
    });
  },

  // Handles the category Offer of a category with new information..
  addcategoryOffer: async (req, res) => {
    const { productname, offerpercentage } = req.body;
    const offerpercentageNumeric = parseInt(offerpercentage);
    try {
      const pro = await category.findOne({ categoryName: productname });

      if (pro.categorypercentage == 0) {
        await product.updateMany({ category: productname }, [
          {
            $set: {
              categorypercentage: offerpercentageNumeric,
              categoryprice: {
                $trunc: {
                  $subtract: [
                    "$price",
                    {
                      $multiply: [
                        "$price",
                        { $divide: [offerpercentageNumeric, 100] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        ]);

        const productUpdate = await category.updateOne(
          { categoryName: productname },
          { $set: { categorypercentage: offerpercentage } }
        );
        req.flash("success", "Offer Applied");
        res.redirect("/admin/categoryoffer");
      } else {
        req.flash("title", "Product Already have an Offer");
        res.redirect("/admin/categoryoffer");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  //Removes the particular category offer.
  removecategoryOffer: async (req, res) => {
    const { id, categoryname } = req.body;
    console.log(id);
    console.log(categoryname);
    try {
      await product.updateMany(
        { category: categoryname },
        { $set: { categorypercentage: 0, categoryprice: 0 } }
      );

      const pro = await category.findByIdAndUpdate(id, {
        $set: { categorypercentage: 0 },
      });
      if (pro) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.send({ message: "0" });
    }
  },
};

module.exports = admin;
