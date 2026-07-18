import Dexie, { Table } from 'dexie';

export interface Customer {
  id?: string;
  customerId: string;
  name: string;
  company: string;
  designation: string;
  mobile: string;
  alternateMobile: string;
  whatsapp: string;
  email: string;
  website: string;
  gst: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  products: string;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export class CardScannerDB extends Dexie {
  customers!: Table<Customer, string>;

  constructor() {
    super('CardScannerDB_v2');
    this.version(1).stores({
      customers: 'id, customerId, name, company, mobile, email, gst'
    });
  }
}

export const db = new CardScannerDB();

// Helper to generate IDs like CUST-000001
export async function generateCustomerId(): Promise<string> {
  const count = await db.customers.count();
  const nextId = count + 1;
  return `CUST-${nextId.toString().padStart(6, '0')}`;
}
