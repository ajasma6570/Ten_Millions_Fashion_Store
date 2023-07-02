// helper/errorMiddleware.js
const express=require('express')

const app=express()
// Set the view engine to use EJS
app.set('view engine', 'ejs');

// Set the 'views' directory to the root 'views' folder
app.set('views', 'views','./views/userViews');

// Middleware to handle unhandled routes
const notFoundHandler = (req, res, next) => {
  const error = new Error('Page not found');
  error.status = 404;
  next(error);
};

// Error handling middleware to display the error message
const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  res.status(status).render('error', { error: message }); // Render 'error.ejs' template with the error message
};

module.exports = {
  notFoundHandler,
  errorHandler,
};