import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, createClinic, updateClinic } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ClinicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    openingTime: '09:00',
    closingTime: '18:00',
    description: '',
  });

  useEffect(() => {
    if (id) {
      const fetchClinic = async () => {
        try {
          const res = await getMyClinics();
          const clinic = res.data.data.clinics?.find((c) => c.id === id);
          if (clinic) {
            setFormData({
              name: clinic.name || '',
              phone: clinic.phone || '',
              address: clinic.address || '',
              city: clinic.city || '',
              openingTime: clinic.openingTime || '09:00',
              closingTime: clinic.closingTime || '18:00',
              description: clinic.description || '',
            });
          }
        } catch (err) {
          toast.error('Failed to load clinic');
        } finally {
          setIsLoading(false);
        }
      };
      fetchClinic();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (id) {
        await updateClinic(id, formData);
        toast.success('Clinic updated!');
      } else {
        const res = await createClinic(formData);
        toast.success('Clinic created!');
        navigate(`/owner/clinic/${res.data.data.clinic.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save clinic');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/owner')} className="text-text-muted hover:text-text-primary text-sm">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {id ? 'Edit Clinic' : 'Create Clinic'}
          </h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Clinic Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. City Health Clinic"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 8000000000"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  className="input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Bangalore"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full clinic address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input
                  type="time"
                  className="input"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input
                  type="time"
                  className="input"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your clinic..."
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : (id ? 'Update Clinic' : 'Create Clinic')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClinicProfile;
