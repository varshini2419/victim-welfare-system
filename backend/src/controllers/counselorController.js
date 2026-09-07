const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Victim = require('../models/Victim');

// @desc    Get assigned victims
// @route   GET /api/v1/counselor/victims
// @access  Private/Counselor
const getMyVictims = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ 
    counselorId: req.user._id, 
    status: 'active' 
  });

  const victimIds = assignments.map(a => a.victimId);

  const victims = await Victim.find({ userId: { $in: victimIds } })
    .select('name phone emergencyContact userId');

  // Combine assignment data with victim data
  const result = victims.map(victim => {
    const assignment = assignments.find(a => a.victimId.toString() === victim.userId.toString());
    return {
      victimId: victim.userId,
      name: victim.name,
      phone: victim.phone,
      emergencyContact: victim.emergencyContact,
      assignmentId: assignment._id,
      assignedAt: assignment.createdAt
    };
  });

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

module.exports = {
  getMyVictims
};
