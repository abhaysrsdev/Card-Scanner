"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Camera, Upload, Users, Download, Activity, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      const all = await db.customers.toArray();
      
      const today = new Date().toISOString().split('T')[0];
      const todayCount = all.filter(c => c.createdAt.startsWith(today)).length;
      
      setStats({
        total: all.length,
        today: todayCount
      });

      // Sort by createdAt desc, take 5
      const recent = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
      setRecentCustomers(recent);
    }
    loadStats();
  }, []);

  const exportToExcel = async () => {
    const all = await db.customers.toArray();
    if (all.length === 0) return alert("No records to export.");
    
    const worksheet = XLSX.utils.json_to_sheet(all);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container animate-fade-in">
      <header className="flex items-center justify-between mb-4 mt-4">
        <div>
          <h1>Dashboard</h1>
          <p>AI Visiting Card Scanner</p>
        </div>
        <div className="flex gap-2">
          <Link href="/customers" className="btn btn-secondary">
            <Users size={18} />
            Customers
          </Link>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 mb-4 mt-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted">Total Scans</h3>
            <Users size={24} className="text-primary-color" />
          </div>
          <h2>{stats.total}</h2>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted">Today's Scans</h3>
            <Activity size={24} className="text-success" />
          </div>
          <h2>{stats.today}</h2>
        </div>
        <div className="card flex items-center justify-center gap-4" style={{ flexDirection: 'column' }}>
          <Link href="/scan" className="btn btn-primary w-full" style={{ width: '100%' }}>
            <Camera size={20} />
            Scan New Card
          </Link>
          <Link href="/bulk-scan" className="btn btn-secondary w-full" style={{ width: '100%' }}>
            <Upload size={20} />
            Bulk Scan
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4">Recent Scans</h2>
        {recentCustomers.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p>No cards scanned yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Company</th>
                  <th style={{ padding: '0.75rem' }}>Mobile</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{c.name || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{c.company || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{c.mobile || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{c.createdAt.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
