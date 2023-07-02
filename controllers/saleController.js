const order = require("../models/orderModel");

const salesReport = async (req, res) => {
  try {
    const order_details = await order
      .find({})
      .populate("userid")
      .populate("products.productid")
      .exec();
    order_details.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    res.render("salesReport", { orders: order_details });
  } catch (error) {
    res.status(404).render("error", { error: error.message });
  }
};

module.exports = {
  salesReport,
};
