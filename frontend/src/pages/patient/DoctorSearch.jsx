import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { searchDoctors } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const SPECIALIZATIONS = [
  'All', 'Cardiologist', 'General Physician', 'Dermatologist', 'Orthopedic',
  'Pediatrician', 'Gynecologist', 'Neurologist', 'Psychiatrist', 'ENT',
];

const DoctorSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    specialization: searchParams.get('specialization') || '',
    city: searchParams.get('city') || '',
    available: searchParams.get('available') || '',
  });

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.specialization && filters.specialization !== 'All') params.specialization = filters.specialization;
      if (filters.city) params.city = filters.city;
      if (filters.available) params.available = filters.available;

      const res = await searchDoctors(params);
      setDoctors(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Find Doctors</h1>
          <p className="text-text-muted mt-1">{total} doctors available</p>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Search by name</label>
              <input
                type="text"
                className="input"
                placeholder="Doctor name..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                className="input"
                placeholder="City..."
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Availability</label>
              <select
                className="input"
                value={filters.available}
                onChange={(e) => handleFilterChange('available', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Available Now</option>
              </select>
            </div>
          </div>

          {/* Specialization chips */}
          <div className="mt-4">
            <label className="label">Specialization</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  onClick={() => handleFilterChange('specialization', spec === 'All' ? '' : spec)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (spec === 'All' && !filters.specialization) || filters.specialization === spec
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No doctors found"
            description="Try adjusting your search filters"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const DoctorCard = ({ doctor }) => {
  const clinics = doctor.doctorClinics || [];

  return (
    <Link to={`/patient/doctors/${doctor.id}`} className="card-hover block">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-primary-700 font-bold text-xl">
            {doctor.user?.name?.charAt(0) || 'D'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{doctor.user?.name}</h3>
          <p className="text-sm text-primary-600 font-medium">{doctor.specialization || 'General'}</p>
          <p className="text-xs text-text-muted mt-0.5">{doctor.experienceYears || 0} years experience</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {doctor.offlineAvailable && (
              <span className="badge badge-success">Offline</span>
            )}
            {doctor.onlineAvailable && (
              <span className="badge badge-info">Online</span>
            )}
          </div>
        </div>

        {clinics.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted truncate">
              📍 {clinics[0].clinic?.name}, {clinics[0].clinic?.city}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default DoctorSearch;
