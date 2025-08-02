import { UserController } from '../../server/server/controllers/index.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Add id to params for controller
    req.params = { id: req.query.id };

    switch (req.method) {
      case 'GET':
        await UserController.getUser(req, res);
        break;
      case 'PUT':
        await UserController.updateUser(req, res);
        break;
      case 'DELETE':
        await UserController.deleteUser(req, res);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}