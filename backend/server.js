require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');

// Import User Model for seeding
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BIS Student Affairs API',
      version: '1.0.0',
      description: 'Interactive API documentation for the Student Affairs System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./routes/api.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import and Register Routes
const apiRoutes = require('./routes/api');
app.use('/', apiRoutes);

// 404 Route for non-existing endpoints
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'الرابط المطلوب غير موجود' });
});

// Start Database & Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed default admin if not present
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedAdminPassword,
        name: 'مدير النظام',
        role: 'admin'
      });
      console.log('Default admin user seeded successfully');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
