require('dotenv').config();
const mongoose = require('mongoose');
const ExclusiveBanner = require('../models/ExclusiveBanner');
const connectDB = require('../config/db');
const test = async () => {
    try {
        await connectDB();
        const banners = await ExclusiveBanner.find({}).sort({ order: 1 });
      
        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};
test();
