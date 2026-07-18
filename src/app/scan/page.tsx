"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, Check, X, RefreshCw } from 'lucide-react';
import { processVisitingCard } from '@/lib/ocr';
import { db, generateCustomerId, Customer } from '@/lib/db';

export default function ScanPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  
  const [mode, setMode] = useState<'capture' | 'review'>('capture');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleCapture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
        await runOCR(imageSrc);
      }
    }
  }, [webcamRef]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImage(base64);
        await runOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async (imageSrc: string) => {
    setLoading(true);
    try {
      const extracted = await processVisitingCard(imageSrc);
      setFormData(extracted);
      setMode('review');
    } catch (error) {
      alert("Failed to read card. Please try again or enter details manually.");
      setMode('review');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkDuplicates = async () => {
    const all = await db.customers.toArray();
    return all.some(c => 
      (formData.mobile && c.mobile === formData.mobile) ||
      (formData.email && c.email === formData.email) ||
      (formData.gst && c.gst === formData.gst)
    );
  };

  const handleSave = async (forceSave = false) => {
    if (!forceSave) {
      const isDuplicate = await checkDuplicates();
      if (isDuplicate) {
        setDuplicateWarning(true);
        return;
      }
    }

    const customerId = await generateCustomerId();
    const newCustomer: Customer = {
      customerId,
      name: formData.name || '',
      company: formData.company || '',
      designation: formData.designation || '',
      mobile: formData.mobile || '',
      alternateMobile: formData.alternateMobile || '',
      whatsapp: formData.whatsapp || '',
      email: formData.email || '',
      website: formData.website || '',
      gst: formData.gst || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      country: formData.country || '',
      pincode: formData.pincode || '',
      products: formData.products || '',
      category: formData.category || '',
      notes: formData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.customers.add(newCustomer);
    router.push('/');
  };

  return (
    <div className="container animate-fade-in">
      {loading && (
        <div className="loading-overlay">
          <RefreshCw size={48} className="animate-pulse text-primary-color mb-4" />
          <h2>Reading Visiting Card...</h2>
          <p>Please wait, AI is extracting details.</p>
        </div>
      )}

      {mode === 'capture' && !loading && (
        <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="mb-4">Scan Visiting Card</h2>
          
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: "environment" }}
            />
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={handleCapture} className="btn btn-primary" style={{ flex: 1 }}>
              <Camera size={20} />
              Capture
            </button>
            <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
              <ImageIcon size={20} />
              Upload Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
          
          <button onClick={() => router.push('/')} className="btn btn-icon mt-4">
            Cancel
          </button>
        </div>
      )}

      {mode === 'review' && !loading && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="mb-4">Review Details</h2>
          
          {duplicateWarning && (
            <div className="toast warning" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <strong>Duplicate Found!</strong>
                <p>This customer (Email, Mobile, or GST) already exists.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSave(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Save Anyway</button>
                <button onClick={() => setDuplicateWarning(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" value={formData.name || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input type="text" name="company" className="form-input" value={formData.company || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input type="text" name="designation" className="form-input" value={formData.designation || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input type="text" name="mobile" className="form-input" value={formData.mobile || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" value={formData.email || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input type="text" name="gst" className="form-input" value={formData.gst || ''} onChange={handleInputChange} />
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 justify-between">
             <button onClick={() => setMode('capture')} className="btn btn-secondary">
              <RefreshCw size={18} />
              Rescan
            </button>
            <div className="flex gap-4">
              <button onClick={() => router.push('/')} className="btn btn-secondary">
                <X size={18} />
                Cancel
              </button>
              <button onClick={() => handleSave()} className="btn btn-primary">
                <Check size={18} />
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
