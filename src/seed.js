require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Dish = require('./models/Dish');
const Order = require('./models/Order');

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Cleaning existing data...');
    await User.deleteMany({});
    await Dish.deleteMany({});
    await Order.deleteMany({});

    console.log('[Seed] Creating demo users (Admin, Chefs, Customers)...');

    // 1. Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@dishbooking.com',
      password: 'password123',
      role: 'admin',
      phone: '+919000000001',
    });

    // 2. Chefs
    const chef1 = await User.create({
      name: 'Chef Vikram Khanna',
      email: 'chef.vikram@dishbooking.com',
      password: 'password123',
      role: 'chef',
      phone: '+919811122334',
    });

    const chef2 = await User.create({
      name: 'Chef Anita Roy',
      email: 'chef.anita@dishbooking.com',
      password: 'password123',
      role: 'chef',
      phone: '+919822233445',
    });

    // 3. Regular Customers / Users
    const user1 = await User.create({
      name: 'Aarav Mehta',
      email: 'aarav@example.com',
      password: 'password123',
      role: 'user',
      phone: '+919876543210',
    });

    const user2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'password123',
      role: 'user',
      phone: '+919876543211',
    });

    console.log('[Seed] Creating sample dishes across categories...');

    // 4. Sample Dishes
    const dishes = await Dish.insertMany([
      {
        name: 'Paneer Butter Masala',
        description: 'Soft cottage cheese cubes simmered in a rich tomato, butter, and cashew nut gravy.',
        price: 280.0,
        category: 'Main Course',
        cuisine: 'North Indian',
        isAvailable: true,
        preparationTimeMinutes: 25,
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
        createdBy: admin._id,
      },
      {
        name: 'Crispy Veg Spring Rolls',
        description: 'Golden fried crispy rolls stuffed with shredded vegetables and served with sweet chili sauce.',
        price: 180.0,
        category: 'Appetizer',
        cuisine: 'Indo-Chinese',
        isAvailable: true,
        preparationTimeMinutes: 15,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        createdBy: admin._id,
      },
      {
        name: 'Dal Makhani',
        description: 'Slow-cooked whole black lentils and red kidney beans simmered overnight with butter and fresh cream.',
        price: 240.0,
        category: 'Main Course',
        cuisine: 'North Indian',
        isAvailable: true,
        preparationTimeMinutes: 20,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        createdBy: admin._id,
      },
      {
        name: 'Gulab Jamun with Rabri',
        description: 'Warm, golden brown milk-solid dumplings soaked in rose flavored sugar syrup, served with creamy rabri.',
        price: 150.0,
        category: 'Dessert',
        cuisine: 'Indian Sweet',
        isAvailable: true,
        preparationTimeMinutes: 10,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
        createdBy: admin._id,
      },
      {
        name: 'Fresh Mint Mojito',
        description: 'Refreshing blend of crushed fresh mint leaves, lime juice, sparkling soda, and cane sugar.',
        price: 120.0,
        category: 'Beverage',
        cuisine: 'Continental',
        isAvailable: true,
        preparationTimeMinutes: 8,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        createdBy: admin._id,
      },
    ]);

    console.log('[Seed] Creating demo orders with random chef assignment...');

    // 5. Sample Order for user1 assigned to chef1 (Status: Order Received)
    const order1 = await Order.create({
      user: user1._id,
      items: [
        {
          dish: dishes[0]._id,
          name: dishes[0].name,
          price: dishes[0].price,
          quantity: 2,
        },
        {
          dish: dishes[3]._id,
          name: dishes[3].name,
          price: dishes[3].price,
          quantity: 1,
        },
      ],
      totalAmount: 280 * 2 + 150,
      status: 'Order Received',
      assignedChef: chef1._id,
      deliveryAddress: 'Flat 301, Silver Sands Apartments, Bandra West, Mumbai',
      contactPhone: user1.phone,
      specialInstructions: 'Please make it medium spicy',
    });

    // 6. Sample Order for user2 assigned to chef2 (Status: Delivered)
    const order2 = await Order.create({
      user: user2._id,
      items: [
        {
          dish: dishes[1]._id,
          name: dishes[1].name,
          price: dishes[1].price,
          quantity: 2,
        },
        {
          dish: dishes[4]._id,
          name: dishes[4].name,
          price: dishes[4].price,
          quantity: 2,
        },
      ],
      totalAmount: 180 * 2 + 120 * 2,
      status: 'Delivered',
      assignedChef: chef2._id,
      deliveryAddress: 'House 45, Lotus Enclave, Powai, Mumbai',
      contactPhone: user2.phone,
      deliveredAt: new Date(),
    });

    console.log('=======================================================');
    console.log(' [Seed Success] Database populated with demo accounts:');
    console.log(' 1. Admin: admin@dishbooking.com (password123)');
    console.log(' 2. Chef 1: chef.vikram@dishbooking.com (password123)');
    console.log(' 3. Chef 2: chef.anita@dishbooking.com (password123)');
    console.log(' 4. User 1: aarav@example.com (password123)');
    console.log(' 5. User 2: priya@example.com (password123)');
    console.log(` 6. Dishes Created: ${dishes.length} dishes`);
    console.log(` 7. Orders Created: Order #${order1._id} and Order #${order2._id}`);
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
