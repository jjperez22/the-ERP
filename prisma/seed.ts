import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { code: 'ACME' },
    update: {},
    create: {
      code: 'ACME',
      name: 'ACME Construction Supplies',
      email: 'orders@acmeconstruction.com',
      phone: '+1-555-0123',
      address: '123 Industrial Blvd, Construction City, CC 12345'
    }
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { code: 'BIG' },
    update: {},
    create: {
      code: 'BIG',
      name: 'Big Build Materials',
      email: 'sales@bigbuild.com',
      phone: '+1-555-0456',
      address: '456 Materials Ave, Builder Town, BT 67890'
    }
  });

  // Create products
  const products = [
    {
      sku: 'CEM-001',
      name: 'Portland Cement 94lb',
      category: 'Cement',
      price: 15.99,
      cost: 12.50,
      stock: 500,
      reorderPoint: 100,
      supplierId: supplier1.id
    },
    {
      sku: 'RBR-001',
      name: 'Steel Rebar #4 20ft',
      category: 'Steel',
      price: 28.75,
      cost: 22.50,
      stock: 200,
      reorderPoint: 50,
      supplierId: supplier1.id
    },
    {
      sku: 'LMB-001', 
      name: '2x4x8 Pressure Treated Lumber',
      category: 'Lumber',
      price: 12.99,
      cost: 9.75,
      stock: 300,
      reorderPoint: 75,
      supplierId: supplier2.id
    },
    {
      sku: 'AGG-001',
      name: 'Crushed Stone 3/4" per ton',
      category: 'Aggregate',
      price: 45.00,
      cost: 35.00,
      stock: 50,
      reorderPoint: 15,
      supplierId: supplier2.id
    },
    {
      sku: 'BLK-001',
      name: 'Concrete Block 8x8x16',
      category: 'Masonry',
      price: 3.25,
      cost: 2.50,
      stock: 1000,
      reorderPoint: 200,
      supplierId: supplier1.id
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  // Create customers
  const customers = [
    {
      name: 'ABC Construction Co.',
      email: 'orders@abcconstruction.com',
      phone: '+1-555-1000',
      address: '789 Builder St, Construction City, CC 11111'
    },
    {
      name: 'Premium Home Builders',
      email: 'purchasing@premiumhomes.com',
      phone: '+1-555-2000',
      address: '321 Developer Dr, Home Town, HT 22222'
    },
    {
      name: 'City Infrastructure Dept',
      email: 'procurement@cityinfra.gov',
      phone: '+1-555-3000',
      address: '555 Municipal Plaza, Government City, GC 33333'
    }
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: customer
    });
  }

  // Create sample orders
  const customer1 = await prisma.customer.findFirst({
    where: { email: 'orders@abcconstruction.com' }
  });

  const customer2 = await prisma.customer.findFirst({
    where: { email: 'purchasing@premiumhomes.com' }
  });

  if (customer1) {
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-001',
        customerId: customer1.id,
        status: 'CONFIRMED',
        totalAmount: 1599.50,
        items: {
          create: [
            {
              productId: (await prisma.product.findFirst({ where: { sku: 'CEM-001' } }))!.id,
              quantity: 100,
              unitPrice: 15.99,
              totalPrice: 1599.00
            }
          ]
        }
      }
    });

    console.log('✅ Created order:', order1.orderNumber);
  }

  if (customer2) {
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-002', 
        customerId: customer2.id,
        status: 'PROCESSING',
        totalAmount: 3899.25,
        items: {
          create: [
            {
              productId: (await prisma.product.findFirst({ where: { sku: 'LMB-001' } }))!.id,
              quantity: 300,
              unitPrice: 12.99,
              totalPrice: 3897.00
            }
          ]
        }
      }
    });

    console.log('✅ Created order:', order2.orderNumber);
  }

  // Create sample projects
  if (customer1) {
    const project1 = await prisma.project.create({
      data: {
        name: 'Downtown Office Complex',
        description: 'Modern 12-story office building with retail space',
        customerId: customer1.id,
        status: 'ACTIVE',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        budget: 2500000.00
      }
    });

    console.log('✅ Created project:', project1.name);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
