import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { tankService } from '../services/tank.service';
import { toast } from 'sonner';
import type { TankRecordFormData, TankRecord } from '../types';

interface CreateTankRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: TankRecord | null;
}

export function CreateTankRecordModal({ isOpen, onClose, onSuccess, editRecord }: CreateTankRecordModalProps) {
  const [formData, setFormData] = useState<Partial<TankRecordFormData>>({
    date: new Date().toISOString().split('T')[0],
    tank_number: '',
    batch_number: '',
    milk_quantity: 0,
    fat_percentage: 0,
    snf_percentage: 0,
    temperature: 4,
    milk_type: 'cow',
    tank_release_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    packing_machine_detail: '',
    release_time: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (!editRecord) {
        setFormData(prev => ({
          ...prev,
          tank_release_time: now.toLocaleTimeString('en-US', { hour12: false }),
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [editRecord]);

  useEffect(() => {
    if (editRecord) {
      setFormData({
        date: editRecord.date,
        tank_number: editRecord.tank_number,
        batch_number: editRecord.batch_number,
        milk_quantity: editRecord.milk_quantity,
        fat_percentage: editRecord.fat_percentage,
        snf_percentage: editRecord.snf_percentage,
        temperature: editRecord.temperature || 4,
        milk_type: editRecord.milk_type || 'cow',
        tank_release_time: editRecord.tank_release_time || new Date().toLocaleTimeString('en-US', { hour12: false }),
        packing_machine_detail: editRecord.packing_machine_detail || '',
        release_time: editRecord.release_time || '',
        remarks: editRecord.remarks || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        tank_number: '',
        batch_number: '',
        milk_quantity: 0,
        fat_percentage: 0,
        snf_percentage: 0,
        temperature: 4,
        milk_type: 'cow',
        tank_release_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        packing_machine_detail: '',
        release_time: '',
        remarks: '',
      });
    }
    setErrors({});
  }, [editRecord, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tank_number?.trim()) {
      newErrors.tank_number = 'Tank number is required';
    }

    if (!formData.batch_number?.trim()) {
      newErrors.batch_number = 'Batch number is required';
    }

    if (!formData.milk_quantity || formData.milk_quantity <= 0) {
      newErrors.milk_quantity = 'Quantity must be greater than 0';
    }

    if (formData.milk_quantity && formData.milk_quantity > 100000) {
      newErrors.milk_quantity = 'Quantity cannot exceed 100,000 liters';
    }

    if (!formData.fat_percentage || formData.fat_percentage < 0 || formData.fat_percentage > 100) {
      newErrors.fat_percentage = 'FAT % must be between 0 and 100';
    }

    if (!formData.snf_percentage || formData.snf_percentage < 0 || formData.snf_percentage > 100) {
      newErrors.snf_percentage = 'SNF % must be between 0 and 100';
    }

    if (!formData.temperature || formData.temperature < -10 || formData.temperature > 50) {
      newErrors.temperature = 'Temperature must be between -10°C and 50°C';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      if (editRecord) {
        await tankService.update(editRecord.id, formData as TankRecordFormData);
        toast.success('Tank record updated successfully');
      } else {
        await tankService.create(formData as TankRecordFormData);
        toast.success('Tank record created successfully');
      }
      onSuccess();
      onClose();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        tank_number: '',
        batch_number: '',
        milk_quantity: 0,
        fat_percentage: 0,
        snf_percentage: 0,
        temperature: 4,
        milk_type: 'cow',
        tank_release_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        packing_machine_detail: '',
        release_time: '',
        remarks: '',
      });
      setErrors({});
    } catch (error: any) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((e: any) => e.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || `Failed to ${editRecord ? 'update' : 'create'} tank record`);
      }
    } finally {
      setLoading(false);
    }
  };

  const milkTypeOptions = [
    { value: 'cow', label: 'Cow Milk' },
    { value: 'buffalo', label: 'Buffalo Milk' },
    { value: 'mixed', label: 'Mixed Milk' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{editRecord ? 'Edit Tank Record' : 'Create New Tank Record'}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{currentTime.toLocaleTimeString()}</span>
                    <span>|</span>
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    id="date"
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                  <div>
                    <Input
                      id="tank_number"
                      label="Tank Number"
                      type="text"
                      value={formData.tank_number}
                      onChange={(e) => setFormData({ ...formData, tank_number: e.target.value })}
                      placeholder="e.g., T-001"
                      required
                      error={errors.tank_number}
                    />
                  </div>
                  <div>
                    <Input
                      id="tank_release_time"
                      label="Sample Time"
                      type="time"
                      value={formData.tank_release_time}
                      onChange={(e) => setFormData({ ...formData, tank_release_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="release_time"
                      label="Tank Release Time"
                      type="time"
                      value={formData.release_time || ''}
                      onChange={(e) => setFormData({ ...formData, release_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      id="batch_number"
                      label="Batch Number"
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      placeholder="e.g., B-001"
                      required
                      error={errors.batch_number}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      id="milk_type"
                      label="Milk Type"
                      value={formData.milk_type}
                      onChange={(e) => setFormData({ ...formData, milk_type: e.target.value as any })}
                      options={milkTypeOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      id="milk_quantity"
                      label="Milk Quantity (Liters)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.milk_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, milk_quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                      error={errors.milk_quantity}
                    />
                  </div>
                  <div>
                    <Input
                      id="fat_percentage"
                      label="FAT %"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.fat_percentage || ''}
                      onChange={(e) => setFormData({ ...formData, fat_percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                      error={errors.fat_percentage}
                    />
                  </div>
                  <div>
                    <Input
                      id="snf_percentage"
                      label="SNF %"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.snf_percentage || ''}
                      onChange={(e) => setFormData({ ...formData, snf_percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                      error={errors.snf_percentage}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="packing_machine_detail"
                      label="Packing Machine Detail"
                      type="text"
                      value={formData.packing_machine_detail || ''}
                      onChange={(e) => setFormData({ ...formData, packing_machine_detail: e.target.value })}
                      placeholder="e.g., PM-01 / Line-A"
                    />
                  </div>
                  <div>
                    <Input
                      id="temperature"
                      label="Temperature (°C)"
                      type="number"
                      step="0.1"
                      value={formData.temperature || ''}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                      placeholder="4.0"
                      required
                      error={errors.temperature}
                    />
                  </div>
                </div>

                <Input
                  id="remarks"
                  label="Remarks"
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional notes..."
                />

                <div className="flex gap-4 justify-end pt-4 border-t border-secondary-200">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (editRecord ? 'Updating...' : 'Creating...') : (editRecord ? 'Update Record' : 'Create Record')}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
