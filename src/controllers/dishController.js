const Dish = require('../models/Dish');

/**
 * @desc    Create a new dish
 * @route   POST /api/dishes
 * @access  Private (Admin only)
 */
const createDish = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      cuisine,
      isAvailable,
      preparationTimeMinutes,
      imageUrl,
    } = req.body;

    if (!name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and price are required fields',
      });
    }

    const dish = await Dish.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category || 'Main Course',
      cuisine: cuisine ? cuisine.trim() : 'Multi-Cuisine',
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTimeMinutes: preparationTimeMinutes ? parseInt(preparationTimeMinutes, 10) : 20,
      imageUrl: imageUrl || undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      dish,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all dishes with optional search and category filters
 * @route   GET /api/dishes
 * @access  Public
 */
const getAllDishes = async (req, res, next) => {
  try {
    const { category, search, available, minPrice, maxPrice, sort } = req.query;

    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by availability
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };

    const dishes = await Dish.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: dishes.length,
      dishes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single dish by ID
 * @route   GET /api/dishes/:id
 * @access  Public
 */
const getDishById = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish not found with id ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      dish,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a dish
 * @route   PUT /api/dishes/:id (or PATCH /api/dishes/:id)
 * @access  Private (Admin only)
 */
const updateDish = async (req, res, next) => {
  try {
    let dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish not found with id ${req.params.id}`,
      });
    }

    dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Dish updated successfully',
      dish,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a dish
 * @route   DELETE /api/dishes/:id
 * @access  Private (Admin only)
 */
const deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish not found with id ${req.params.id}`,
      });
    }

    await Dish.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Dish deleted successfully',
      dishId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDish,
  getAllDishes,
  getDishById,
  updateDish,
  deleteDish,
};
