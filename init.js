// Initialize the application with default admin user
// This script should be run once to set up the admin account

// Check if already initialized
if (!localStorage.getItem('appInitialized')) {
  // Create default admin user
  const adminUser = {
    id: 'ADMIN_000',
    fullName: 'Admin User',
    email: 'admin@dominic',
    phone: '+1234567890',
    password: 'Aquafina2005', // In production, this should be hashed
    createdAt: new Date().toISOString(),
    portfolio: {
      BTC: 0,
      ETH: 0,
      USDT: 0,
      SOL: 0,
      XRP: 0,
      ADA: 0,
      BNB: 0,
      DOGE: 0,
      AVAX: 0,
      LINK: 0
    },
    totalValue: 0,
    status: 'active'
  };

  // Get existing users or create new array
  let users = JSON.parse(localStorage.getItem('tradeflexUsers') || '[]');

  // Check if admin already exists
  if (!users.some(u => u.email === 'admin@dominic')) {
    users.unshift(adminUser);
    localStorage.setItem('tradeflexUsers', JSON.stringify(users));
  }

  // Mark as initialized
  localStorage.setItem('appInitialized', 'true');
  
  console.log('✓ Application initialized successfully');
  console.log('Admin account created: admin@dominic');
  console.log('Admin password: Aquafina2005');
}
