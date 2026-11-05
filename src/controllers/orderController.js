const Order = require('../models/Order');
const Dish = require('../models/Dish');
const User = require('../models/User');
const { sendOrderDeliveredEmail } = require('../utils/emailService');

/**
 * @desc    Place a new dish order
 * @route   POST /api/orders
 * @access  Private (User only)
 */
const createOrder = async (req, res, next) => {
  try {
    const { items, dishId, quantity, deliveryAddress, contactPhone, specialInstructions } = req.body;

    // Normalizing item input (support array of items or single dishId/quantity)
    let rawItems = [];
    if (Array.isArray(items) && items.length > 0) {
      rawItems = items;
    } else if (dishId) {
      rawItems = [{ dishId, quantity: quantity || 1 }];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one dish in the order items',
      });
    }

    if (!deliveryAddress || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and contact phone are required to place an order',
      });
    }

    // Process and validate all dishes, compute total
    const processedItems = [];
    let calculatedTotal = 0;

    for (const item of rawItems) {
      const idToFind = item.dishId || item.dish || item.id || item._id;
      const dish = await Dish.findById(idToFind);

      if (!dish) {
        return res.status(404).json({
          success: false,
          message: `Dish with ID '${idToFind}' was not found in menu`,
        });
      }

      if (!dish.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Dish '${dish.name}' is currently unavailable`,
        });
      }

      const qty = parseInt(item.quantity || 1, 10);
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for dish '${dish.name}'`,
        });
      }

      const subtotal = dish.price * qty;
      calculatedTotal += subtotal;

      processedItems.push({
        dish: dish._id,
        name: dish.name,
        price: dish.price,
        quantity: qty,
      });
    }

    // Automatic Chef Assignment (Pick a random chef)
    const availableChefs = await User.find({ role: 'chef' });

    let assignedChefId;
    if (availableChefs.length > 0) {
      // Pick random chef
      const randomIndex = Math.floor(Math.random() * availableChefs.length);
      assignedChefId = availableChefs[randomIndex]._id;
    } else {
      // Graceful fallback if no chef registered yet: assign to an admin or create temp chef
      const fallbackAdmin = await User.findOne({ role: 'admin' });
      if (fallbackAdmin) {
        assignedChefId = fallbackAdmin._id;
      } else {
        // If no chef/admin in system, assign to order placer to prevent failure
        assignedChefId = req.user._id;
      }
    }

    // Create the order with initial status "Order Received"
    const order = await Order.create({
      user: req.user._id,
      items: processedItems,
      totalAmount: Math.round(calculatedTotal * 100) / 100,
      status: 'Order Received', // Strict requirement
      assignedChef: assignedChefId,
      deliveryAddress: deliveryAddress.trim(),
      contactPhone: contactPhone.trim(),
      specialInstructions: specialInstructions ? specialInstructions.trim() : '',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('assignedChef', 'name email role')
      .populate('items.dish', 'name category price imageUrl');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and assigned to a chef',
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's own orders (or chef's assigned orders, or admin's all orders)
 * @route   GET /api/orders (or /api/orders/my-orders)
 * @access  Private (User, Chef, Admin)
 */
const getOrders = async (req, res, next) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      // User can only see their own orders
      query.user = req.user._id;
    } else if (req.user.role === 'chef') {
      // Chef sees orders assigned to them
      query.assignedChef = req.user._id;
    }
    // Admin sees all orders

    // Optional query status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('assignedChef', 'name email phone')
      .populate('items.dish', 'name price category imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Owner user, Assigned Chef, or Admin)
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedChef', 'name email phone')
      .populate('items.dish', 'name price category imageUrl');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id ${req.params.id}`,
      });
    }

    // Role check: User owns it, Chef is assigned, or Admin
    const isOwner = order.user && order.user._id.equals(req.user._id);
    const isAssignedChef = order.assignedChef && order.assignedChef._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedChef && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own dish order (Delivery address, phone, or instructions)
 * @route   PUT /api/orders/:id
 * @access  Private (User only)
 */
const updateMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id ${req.params.id}`,
      });
    }

    // Ensure order belongs to requesting user
    if (!order.user.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own dish orders',
      });
    }

    // User can only update if status is still "Order Received"
    if (order.status !== 'Order Received' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `Cannot update order in '${order.status}' status. Orders can only be modified while in 'Order Received' state.`,
      });
    }

    const { deliveryAddress, contactPhone, specialInstructions } = req.body;
    if (deliveryAddress) order.deliveryAddress = deliveryAddress.trim();
    if (contactPhone) order.contactPhone = contactPhone.trim();
    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions.trim();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Cancel own dish order
 * @route   DELETE /api/orders/:id
 * @access  Private (User only)
 */
const deleteMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id ${req.params.id}`,
      });
    }

    // Ensure user owns order or is admin
    if (!order.user.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order',
      });
    }

    // Cannot cancel if already delivered
    if (order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order that has already been delivered',
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled and deleted successfully',
      orderId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Preparing, Out for Delivery, Delivered)
 * @route   PATCH /api/orders/:id/status (or PUT /api/orders/:id/status)
 * @access  Private (Chef or Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed statuses are: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedChef', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id ${req.params.id}`,
      });
    }

    // If role is chef, verify order assignment (or allow admin override)
    if (req.user.role === 'chef') {
      if (!order.assignedChef || !order.assignedChef._id.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to update orders assigned to you',
        });
      }
    }

    const previousStatus = order.status;
    order.status = status;

    // When status turns to Delivered: record delivery timestamp and send email notification
    let emailDispatched = false;
    let previewUrl = null;

    if (status === 'Delivered') {
      order.deliveredAt = new Date();

      // Send email to user stating order delivered along with order details
      if (order.user && order.user.email) {
        const emailResult = await sendOrderDeliveredEmail({
          to: order.user.email,
          userName: order.user.name,
          order,
          chefName: order.assignedChef ? order.assignedChef.name : req.user.name,
        });

        emailDispatched = emailResult.success;
        previewUrl = emailResult.previewUrl || null;
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated from '${previousStatus}' to '${status}' successfully.`,
      emailDispatched,
      previewUrl,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateMyOrder,
  deleteMyOrder,
  updateOrderStatus,
};
