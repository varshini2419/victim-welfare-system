const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Case = require('../models/Case');

// @desc    Get Geographic Reports Aggregation
// @route   GET /api/v1/admin/reports/geographic
// @access  Private/Admin
const getGeographicReports = asyncHandler(async (req, res) => {
  const state = req.user.state;

  const districtAggregation = await User.aggregate([
    { $match: { role: 'victim', state: state } },
    {
      $group: {
        _id: '$district',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        district: { $ifNull: ['$_id', 'Unknown'] },
        count: 1,
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: districtAggregation
  });
});

module.exports = {
  getGeographicReports
};
