import { connectionPool } from './index.js';

async function seedPayments() {
  console.log('Seeding payment records...');

  const [existing] = await connectionPool.query('SELECT COUNT(*) as count FROM payments');
  const count = (existing as any)[0]?.count || 0;

  if (count > 0) {
    console.log(`Payments table already has ${count} records.`);
    process.exit(0);
  }

  const samplePayments = [
    {
      order_id: 3,
      provider: 'Razorpay',
      reference: 'pay_RZP_Kavya99281',
      amount: '290000.00',
      status: 'paid',
      created_at: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
    {
      order_id: 4,
      provider: 'Stripe',
      reference: 'ch_3M4kL0Roy88214',
      amount: '195000.00',
      status: 'paid',
      created_at: new Date(Date.now() - 86400000 * 4), // 4 days ago
    },
    {
      order_id: 5,
      provider: 'UPI (HDFC Bank)',
      reference: 'UPI/428901847192/Rohan',
      amount: '60000.00',
      status: 'paid',
      created_at: new Date(Date.now() - 86400000 * 1), // 1 day ago
    },
    {
      order_id: 1,
      provider: 'Bespoke Atelier Wire',
      reference: 'NEFT-MANGESH-90218',
      amount: '145000.00',
      status: 'paid',
      created_at: new Date(Date.now() - 86400000 * 6), // 6 days ago
    },
    {
      order_id: 2,
      provider: 'Razorpay',
      reference: 'pay_RZP_Pending7712',
      amount: '45000.00',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 5), // 5 hours ago
    },
  ];

  for (const p of samplePayments) {
    await connectionPool.query(
      'INSERT INTO payments (order_id, provider, reference, amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [p.order_id, p.provider, p.reference, p.amount, p.status, p.created_at, p.created_at]
    );
  }

  console.log(`Seeded ${samplePayments.length} payment records!`);
  process.exit(0);
}

seedPayments().catch(err => {
  console.error('Error seeding payments:', err);
  process.exit(1);
});
