const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('alertId', 'severity riskLevel callStatus createdAt victimId')
    .populate('callLogId', 'callStatus initiatedAt failureReason');

  res.json({
    success: true,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    data: notifications,
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

const getMyVictimNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('appointmentId', 'appointmentType scheduledAt status rejectionReason');

  res.json({
    success: true,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    data: notifications,
  });
});

const markVictimNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  getMyVictimNotifications,
  markVictimNotificationRead,
};
