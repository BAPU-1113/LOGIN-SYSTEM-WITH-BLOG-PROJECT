const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'An order must contain at least one dish item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'Order Received',
          'Preparing',
          'Out for Delivery',
          'Delivered',
          'Cancelled',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Order Received', // Required by specification
    },
    assignedChef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must be assigned to a chef'],
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please provide delivery address'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Please provide contact phone number for delivery'],
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
