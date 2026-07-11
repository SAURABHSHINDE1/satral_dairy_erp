import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { userService } from '../services/user.service';
import { toast } from 'sonner';
import type { User } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: User | null;
}

interface UserFormData {
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'lab_incharge' | 'quality_incharge' | 'operator' | 'qc_manager';
  password: string;
  confirmPassword: string;
  is_active: boolean;
}

const defaultForm: UserFormData = {
  username: '',
  full_name: '',
  email: '',
  role: 'operator',
  password: '',
  confirmPassword: '',
  is_active: true,
};

export function UserModal({ isOpen, onClose, onSuccess, editUser }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEdit = !!editUser;

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username,
        full_name: editUser.full_name,
        email: editUser.email || '',
        role: editUser.role,
        password: '',
        confirmPassword: '',
        is_active: editUser.is_active ?? true,
      });
    } else {
      setFormData(defaultForm);
    }
    setErrors({});
    setShowPassword(false);
    setShowConfirm(false);
  }, [editUser, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isEdit) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
    } else if (formData.password) {
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && editUser) {
        const updateData: any = {
          full_name: formData.full_name,
          email: formData.email || undefined,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) updateData.password = formData.password;
        await userService.update(editUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        await userService.create({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email || undefined,
          role: formData.role,
          password: formData.password,
        });
        toast.success('User created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((e: any) => e.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'operator',         label: 'Operator' },
    { value: 'lab_incharge',     label: 'Lab Incharge' },
    { value: 'quality_incharge', label: 'Quality Incharge' },
    { value: 'qc_manager',       label: 'QC Manager' },
    { value: 'admin',            label: 'Admin' },
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
            <Card className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">
                  {isEdit ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="full_name"
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g., John Doe"
                    error={errors.full_name}
                    required
                  />
                  <Input
                    id="username"
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g., johndoe"
                    error={errors.username}
                    disabled={isEdit}
                    required
                  />
                </div>

                <Input
                  id="email"
                  label="Email (optional)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@satral.com"
                  error={errors.email}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    id="role"
                    label="Role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    options={roleOptions}
                  />

                  {isEdit && (
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                          formData.is_active
                            ? 'border-success-400 bg-success-50 text-success-700'
                            : 'border-secondary-300 bg-secondary-50 text-secondary-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${formData.is_active ? 'bg-success-500' : 'bg-secondary-400'}`} />
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-100 pt-4">
                  <p className="text-sm font-medium text-text-secondary mb-3">
                    {isEdit ? 'Change Password (leave blank to keep current)' : 'Set Password'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        id="password"
                        label={isEdit ? 'New Password' : 'Password'}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        error={errors.password}
                        required={!isEdit}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        label="Confirm Password"
                        type={showConfirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        error={errors.confirmPassword}
                        required={!isEdit}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-secondary-100">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? isEdit ? 'Saving...' : 'Creating...'
                      : isEdit ? 'Save Changes' : 'Create User'}
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
