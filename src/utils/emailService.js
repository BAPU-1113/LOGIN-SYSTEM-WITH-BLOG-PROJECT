const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Create and return a resilient Nodemailer transporter
 */
const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Fast, instant in-memory transport during automated testing
  if (process.env.NODE_ENV === 'test') {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }

  // If real SMTP credentials are provided in .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback to Nodemailer Ethereal test account (Zero-Config for College & Testing)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Email Service] Initialized Ethereal test mailer account: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    // Ultimate fallback: JSON / console transporter that logs emails safely
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log('[Email Service] Using local console JSON transporter fallback');
    return cachedTransporter;
  }
};

/**
 * Send Password Reset Email with Token Link
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  try {
    const transporter = await getTransporter();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    const resetUrl = `${clientUrl}/api/auth/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Dish Booking System" <no-reply@dishbooking.com>',
      to,
      subject: 'Password Reset Request - Dish Booking System',
      text: `Hello ${name},\n\nYou requested a password reset. Please click the link below or make a POST request with your new password:\n\n${resetUrl}\n\nReset Token: ${resetToken}\n\nThis link is valid for 15 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nDish Booking Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #e65100;">Dish Booking System - Password Reset</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>You recently requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #e65100; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="background: #fff3e0; padding: 12px; border-radius: 6px; font-family: monospace; word-break: break-all;">
            <strong>Reset Token:</strong> ${resetToken}
          </p>
          <p style="color: #666; font-size: 13px;">This link will expire in 15 minutes. If you did not request this, please ignore this email safely.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] Password reset email sent to: ${to} (MessageId: ${info.messageId})`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Preview URL] ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Error] Failed to send password reset email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Order Delivered Email with Detailed Order Summary
 * Triggered automatically when a chef updates status to "Delivered"
 */
const sendOrderDeliveredEmail = async ({ to, userName, order, chefName }) => {
  try {
    const transporter = await getTransporter();

    // Generate HTML list of dishes
    const itemsListHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const itemsListText = order.items
      .map(
        (item) => `- ${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
      )
      .join('\n');

    const deliveryTime = order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : new Date().toLocaleString();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Dish Booking System" <no-reply@dishbooking.com>',
      to,
      subject: `Order Delivered! - Order #${order._id}`,
      text: `Hello ${userName},\n\nGreat news! Your dish order has been successfully delivered!\n\nOrder Details:\nOrder ID: ${order._id}\nDelivery Address: ${order.deliveryAddress}\nDelivered At: ${deliveryTime}\nPrepared by Chef: ${chefName || 'Assigned Chef'}\n\nOrdered Dishes:\n${itemsListText}\n\nTotal Amount: ₹${order.totalAmount.toFixed(2)}\n\nThank you for ordering with us!\nBest regards,\nDish Booking System Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background-color: #2e7d32; color: white; padding: 15px; border-radius: 6px; text-align: center;">
            <h2 style="margin: 0;">🎉 Your Order Has Been Delivered!</h2>
          </div>
          <p style="margin-top: 15px;">Hello <strong>${userName}</strong>,</p>
          <p>Your meal has been prepared fresh and delivered to your address. Enjoy your food!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #333;">Order Information</h4>
            <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #2e7d32; font-weight: bold;">DELIVERED</span></p>
            <p style="margin: 4px 0;"><strong>Delivered At:</strong> ${deliveryTime}</p>
            <p style="margin: 4px 0;"><strong>Prepared by Chef:</strong> ${chefName || 'Our Master Chef'}</p>
            <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>
          </div>

          <h4 style="color: #333;">Dishes Included</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left;">Dish</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; font-weight: bold; text-align: right;">Total Amount:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right; color: #e65100; font-size: 16px;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 25px;">
            Thank you for ordering with Dish Booking System. We hope to serve you again soon!
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Order Email] Delivery confirmation email sent to ${to} for Order #${order._id}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Order Email Preview URL] ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Error] Failed to send order delivered email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderDeliveredEmail,
};
