import { z } from 'zod';

const itemSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  quantity: z.number().positive().finite(),
  price: z.number().nonnegative().finite(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  totalSum: z.number().nonnegative().finite().optional(),
  remarks: z.string().max(500).optional(),
});

export const orderSchema = z.object({
  customerId: z.string().trim().min(1).max(100),
  reference: z.string().trim().min(1).max(100),
  storeId: z.string().optional(),
  priceListId: z.string().optional(),
  mode: z.enum(['Add', 'Update', 'AddOrUpdate']).optional(),
  remarks: z.string().max(2000).optional(),
  details: z.string().max(2000).optional(),
  doJ5: z.string().optional(),
  status: z.string().optional(),
  agentId: z.string().optional(),
  clubCustomer: z.string().optional(),
  payType: z.string().optional(),
  creditPaysNumber: z.string().optional(),
  creditCompany: z.string().optional(),
  creditTransactionType: z.string().optional(),
  creditTokenNumber: z.string().optional(),
  priceFromPriceList: z.string().optional(),
  customer: z.object({
    name: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(200).optional(),
    phone: z.string().max(80).optional(),
    zip: z.string().max(30).optional(),
  }).optional(),
  items: z.array(itemSchema).min(1).max(500),
});
