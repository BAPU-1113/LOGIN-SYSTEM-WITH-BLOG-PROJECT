const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the dish name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Dish name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a dish description'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please specify the dish price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please specify dish category'],
      enum: {
        values: [
          'Appetizer',
          'Main Course',
          'Dessert',
          'Beverage',
          'Salad',
          'Soup',
          'Special',
        ],
        message: '{VALUE} is not a valid category',
      },
      default: 'Main Course',
    },
    cuisine: {
      type: String,
      trim: true,
      default: 'Multi-Cuisine',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 20,
      min: [5, 'Preparation time must be at least 5 minutes'],
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Dish = mongoose.model('Dish', dishSchema);
module.exports = Dish;
