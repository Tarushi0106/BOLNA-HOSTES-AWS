const express = require('express');
const router = express.Router();
const Calls = require('../models/Calls');

router.get('/', async (req, res) => {
  try {
    const calls = await Calls.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

module.exports = router;

