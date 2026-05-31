import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StaffPortalLayout from '../../layouts/StaffPortalLayout';
import ClinicLocationPicker from '../../components/ui/ClinicLocationPicker';
import {
  registerClinicOwner,
  sendClinicOwnerOtp,
  verifyClinicOwnerOtp,
  sendClinicOwnerEmailVerification,
  verifyClinicOwnerEmailOtp,
  uploadClinicOwnerDocument,
} from '../../api/auth.api';

const DRAFT_KEY = 'pulsemate-clinic-owner-registration-draft-v2';

const STEP_LABELS = [
  'Owner Account',
  'Clinic Information',
  'Operational Details',
  'Facilities & Services',
  'Verification & Documents',
  'Review & Submit',
];

const DAY_PRESETS = [
  { day: 'Monday', enabled: true, openingTime: '09:00', closingTime: '19:00', breakStart: '', breakEnd: '' },
  { day: 'Tuesday', enabled: true, openingTime: '09:00', closingTime: '19:00', breakStart: '', breakEnd: '' },
  { day: 'Wednesday', enabled: true, openingTime: '09:00', closingTime: '19:00', breakStart: '', breakEnd: '' },
  { day: 'Thursday', enabled: true, openingTime: '09:00', closingTime: '19:00', breakStart: '', breakEnd: '' },
  { day: 'Friday', enabled: true, openingTime: '09:00', closingTime: '19:00', breakStart: '', breakEnd: '' },
  { day: 'Saturday', enabled: true, openingTime: '09:00', closingTime: '17:00', breakStart: '', breakEnd: '' },
  { day: 'Sunday', enabled: false, openingTime: '09:00', closingTime: '13:00', breakStart: '', breakEnd: '' },
];

const SCHEDULE_PRESETS = [
  { label: 'Standard', desc: 'Mon–Fri 9–7, Sat 9–5', apply: (days) => days.map(d => d.day === 'Sunday' ? { ...d, enabled: false } : d.day === 'Saturday' ? { ...d, enabled: true, openingTime: '09:00', closingTime: '17:00' } : { ...d, enabled: true, openingTime: '09:00', closingTime: '19:00' }) },
  { label: 'Extended', desc: 'Mon–Sat 8–9', apply: (days) => days.map(d => d.day === 'Sunday' ? { ...d, enabled: false } : { ...d, enabled: true, openingTime: '08:00', closingTime: '21:00' }) },
  { label: '24/7', desc: 'All days open', apply: (days) => days.map(d => ({ ...d, enabled: true, openingTime: '00:00', closingTime: '23:59' })) },
];

const STEP_ESTIMATED_MINUTES = [2, 2, 3, 1, 2, 1];

const CLINIC_TYPES = [
  'Individual Clinic',
  'Multi-specialty Clinic',
  'Hospital',
  'Dental Clinic',
  'Eye Clinic',
  'Physiotherapy Center',
  'Diagnostic Center',
  'Other',
];

const SPECIALTY_OPTIONS_BY_CLINIC_TYPE = {
  'Individual Clinic': ['General Medicine', 'Pediatrics', 'ENT', 'Dermatology', 'Gynecology', 'Other'],
  'Multi-specialty Clinic': ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Dermatology', 'ENT', 'Gynecology', 'Other'],
  Hospital: [
    'General Medicine',
    'Pediatrics',
    'Cardiology',
    'Orthopedics',
    'Dermatology',
    'ENT',
    'Gynecology',
    'Dentistry',
    'Ophthalmology',
    'Other',
  ],
  'Dental Clinic': ['Dentistry', 'Orthodontics', 'Endodontics', 'Oral Surgery', 'Periodontics', 'Prosthodontics', 'Other'],
  'Eye Clinic': ['Ophthalmology', 'Optometry', 'Other'],
  'Physiotherapy Center': ['Physiotherapy', 'Sports Rehabilitation', 'Pain Management', 'Other'],
  'Diagnostic Center': ['Pathology', 'Radiology', 'Imaging', 'Laboratory Medicine', 'Other'],
  Other: ['General Medicine', 'Specialty Care', 'Surgery', 'Other'],
};

const getSpecialtyOptions = (clinicType) => SPECIALTY_OPTIONS_BY_CLINIC_TYPE[clinicType] || SPECIALTY_OPTIONS_BY_CLINIC_TYPE.Other;
const CONSULTATION_MODES = ['Offline Consultation', 'Video Consultation', 'Home Visit', 'Online Chat'];
const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
const FACILITIES = [
  'Parking',
  'Wheelchair Access',
  'Pharmacy',
  'Laboratory',
  'AC Waiting Area',
  'Drinking Water',
  'Online Payment',
  'Emergency Care',
  'Lift Access',
  'CCTV Security',
  'Child Friendly Area',
  'WiFi',
];
const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Malayalam'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit/Debit Card', 'Insurance', 'Net Banking'];
const INSURANCE_OPTIONS = ['Star Health', 'Niva Bupa', 'ICICI Lombard', 'HDFC Ergo', 'Aditya Birla', 'Care Health', 'Other'];
const CONSULTATION_TIME_OPTIONS = [5, 10, 15, 20];
const SLOT_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];
const isDevMode = import.meta.env.DEV;
const CONSULTATION_MODE_ICONS = {
  'Offline Consultation': '🏥',
  'Video Consultation': '📹',
  'Home Visit': '🏠',
  'Online Chat': '💬',
};

const initialForm = {
  ownerName: '',
  phone: '',
  ownerOtp: '',
  ownerEmailOtp: '',
  isOwnerMobileVerified: false,
  isOwnerMobileReverifyRequired: false,
  email: '',
  isOwnerEmailVerified: false,
  isOwnerEmailReverifyRequired: false,
  password: '',
  confirmPassword: '',
  clinicName: '',
  clinicType: 'Individual Clinic',
  clinicTypeOther: '',
  clinicDescription: '',
  specialties: [],
  specialtyOther: '',
  numberOfDoctors: '',
  clinicLogoUrl: '',
  clinicCoverImageUrl: '',
  clinicAddress: '',
  landmark: '',
  city: '',
  state: '',
  district: '',
  pincode: '',
  googleMapsLocation: '',
  latitude: '',
  longitude: '',
  clinicPhone: '',
  emergencyContactNumber: '',
  alternateEmail: '',
  consultationModes: ['Offline Consultation'],
  weeklySchedule: DAY_PRESETS,
  averageConsultationTimeMinutes: 10,
  customConsultationTime: '',
  appointmentSlotMinutes: 15,
  dailyPatientCapacity: '',
  facilities: [],
  languagesSpoken: ['English'],
  paymentMethods: ['Cash', 'UPI'],
  insuranceSupported: [],
  clinicRegistrationNumber: '',
  gstNumber: '',
  panNumber: '',
  licenseDocumentUrl: '',
  medicalEstablishmentCertificateUrl: '',
  gstCertificateUrl: '',
  panCardUrl: '',
  additionalDocuments: [],
  confirmAccurate: false,
  agreeTerms: false,
  agreeVerification: false,
};

const buildOpeningHours = (weeklySchedule) =>
  weeklySchedule
    .filter((day) => day.enabled && day.openingTime && day.closingTime)
    .map((day) => {
      const breakChunk = day.breakStart && day.breakEnd ? ` (Break ${day.breakStart}-${day.breakEnd})` : '';
      return `${day.day}: ${day.openingTime}-${day.closingTime}${breakChunk}`;
    })
    .join(', ');

const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
const normalizePhone = (value) => value.replace(/[^\d+]/g, '').trim();
const renderFileName = (value) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  if (normalizedValue.startsWith('upload://')) {
    return normalizedValue.replace(/^upload:\/\//, '');
  }

  try {
    const url = new URL(normalizedValue);
    const fileName = url.pathname.split('/').pop();
    return decodeURIComponent(fileName || normalizedValue).replace(/^\d{13}-/, '');
  } catch (_) {
    return (normalizedValue.split('/').pop() || normalizedValue).replace(/^\d{13}-/, '');
  }
};
const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const uploadFieldConfig = {
  clinicLogoUrl: { label: 'Clinic Logo', helper: 'PNG, JPG, or WEBP preview for brand identity.', accept: 'image/*', image: true },
  clinicCoverImageUrl: { label: 'Clinic Cover Image', helper: 'Used later on your clinic profile.', accept: 'image/*', image: true },
  licenseDocumentUrl: { label: 'Clinic License *', helper: 'PDF, JPG, PNG, or WEBP supported.', accept: '.pdf,image/*' },
  medicalEstablishmentCertificateUrl: {
    label: 'Medical Establishment Certificate *',
    helper: 'Required for compliance review.',
    accept: '.pdf,image/*',
  },
  gstCertificateUrl: { label: 'GST Certificate', helper: 'Optional if GST is registered.', accept: '.pdf,image/*' },
  panCardUrl: { label: 'PAN Card', helper: 'Optional unless required by your setup.', accept: '.pdf,image/*' },
};

const summaryItems = [
  { title: 'Owner Details', step: 0, fields: ['ownerName', 'phone', 'email'] },
  { title: 'Clinic Information', step: 1, fields: ['clinicName', 'clinicType', 'clinicTypeOther', 'specialties', 'specialtyOther'] },
  { title: 'Operational Details', step: 2, fields: ['clinicAddress', 'city', 'district', 'state', 'pincode', 'consultationModes', 'googleMapsLocation'] },
  { title: 'Facilities & Services', step: 3, fields: ['facilities', 'languagesSpoken', 'paymentMethods'] },
  { title: 'Documents Uploaded', step: 4, fields: ['clinicRegistrationNumber', 'licenseDocumentUrl', 'medicalEstablishmentCertificateUrl', 'additionalDocuments'] },
];

const getDraftPayload = (form) => {
  const {
    password,
    confirmPassword,
    ownerOtp,
    ownerEmailOtp,
    isOwnerMobileVerified,
    isOwnerMobileReverifyRequired,
    isOwnerEmailVerified,
    isOwnerEmailReverifyRequired,
    ...safeDraft
  } = form;
  return safeDraft;
};

const getValidationErrors = (form) => {
  const errors = {};

  if (!form.ownerName.trim()) errors.ownerName = 'Owner full name is required.';
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizePhone(form.phone))) errors.phone = 'Enter a valid owner mobile number.';
  if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.isOwnerMobileVerified) errors.ownerOtp = 'Verify the owner mobile number before continuing.';
  if (!form.isOwnerEmailVerified) errors.emailVerification = 'Verify the owner email before continuing.';
  if (!isStrongPassword(form.password)) errors.password = 'Use 8+ characters with upper, lower, number, and symbol.';
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords must match.';

  if (!form.clinicName.trim()) errors.clinicName = 'Clinic name is required.';
  if (!form.clinicType.trim()) errors.clinicType = 'Clinic type is required.';
  if (form.clinicType === 'Other' && !form.clinicTypeOther.trim()) errors.clinicTypeOther = 'Please specify the clinic type.';
  if (!form.specialties.length) errors.specialties = 'Select at least one specialty.';
  if (!form.clinicAddress.trim()) errors.clinicAddress = 'Clinic address is required.';
  else if (form.clinicAddress.trim().length < 5) errors.clinicAddress = 'Clinic address must be at least 5 characters.';
  if (!form.city.trim()) errors.city = 'City is required.';
  else if (form.city.trim().length < 2) errors.city = 'City name must be at least 2 characters.';
  if (!form.state.trim()) errors.state = 'State is required.';
  if (!form.district.trim()) errors.district = 'District is required.';
  else if (form.district.trim().length < 2) errors.district = 'District name must be at least 2 characters.';
  if (!form.pincode.trim()) errors.pincode = 'Pincode is required.';
  else if (form.pincode.trim().length < 4) errors.pincode = 'Enter a valid pincode.';
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizePhone(form.clinicPhone))) errors.clinicPhone = 'Enter a valid clinic phone number.';
  if (form.googleMapsLocation.trim() && !isHttpUrl(form.googleMapsLocation) && form.googleMapsLocation.trim().length < 10) {
    errors.googleMapsLocation = 'Add a valid Google Maps link or a clearer location note.';
  }
  if (!form.consultationModes.length) errors.consultationModes = 'Choose at least one consultation mode.';
  if (!form.weeklySchedule.some((day) => day.enabled)) errors.weeklySchedule = 'Enable at least one operational day.';
  if (form.weeklySchedule.some((day) => day.enabled && (!day.openingTime || !day.closingTime))) {
    errors.weeklySchedule = 'Add opening and closing times for enabled days.';
  }
  if (!(Number(form.averageConsultationTimeMinutes) >= 5)) errors.averageConsultationTimeMinutes = 'Select average consultation time (minimum 5 min).';
  if (!(Number(form.appointmentSlotMinutes) >= 5)) errors.appointmentSlotMinutes = 'Select appointment slot duration (minimum 5 min).';

  if (!form.paymentMethods.length) errors.paymentMethods = 'Select at least one payment method.';

  if (!form.clinicRegistrationNumber.trim()) errors.clinicRegistrationNumber = 'Clinic registration number is required.';
  else if (form.clinicRegistrationNumber.trim().length < 3) errors.clinicRegistrationNumber = 'Registration number must be at least 3 characters.';
  if (!form.licenseDocumentUrl) errors.licenseDocumentUrl = 'Upload the clinic license.';
  if (!form.medicalEstablishmentCertificateUrl) errors.medicalEstablishmentCertificateUrl = 'Upload the medical establishment certificate.';
  if (form.gstNumber.trim() && !form.gstCertificateUrl) errors.gstCertificateUrl = 'Upload the GST certificate for this GST number.';

  if (!form.confirmAccurate) errors.confirmAccurate = 'Confirm the clinic information is accurate.';
  if (!form.agreeTerms) errors.agreeTerms = 'Accept the terms and conditions.';
  if (!form.agreeVerification) errors.agreeVerification = 'Accept clinic verification and compliance review.';

  return errors;
};

const ClinicOwnerRegisterPage = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [uploadPreviews, setUploadPreviews] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [successState, setSuccessState] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [stepDirection, setStepDirection] = useState(1);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeLookupMessage, setPincodeLookupMessage] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState({
    districts: [],
    cities: [],
  });
  const [expandedBreakDays, setExpandedBreakDays] = useState({});
  const specialtyOptions = useMemo(() => getSpecialtyOptions(form.clinicType), [form.clinicType]);

  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);
      const { phoneVerificationToken, emailVerificationToken: legacyEmailVerificationToken, ownerEmailOtp, ...cleanDraft } = parsed || {};
      setForm((current) => ({
        ...current,
        ...cleanDraft,
        ownerEmailOtp: '',
        isOwnerMobileVerified: false,
        isOwnerMobileReverifyRequired: false,
        isOwnerEmailVerified: false,
        isOwnerEmailReverifyRequired: false,
      }));
      setDraftRestored(true);
    } catch (_) {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (successState) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraftPayload(form)));
  }, [form, successState]);

  useEffect(() => {
    if (!otpCooldown) return undefined;

    const timer = window.setInterval(() => {
      setOtpCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const passwordStrength = useMemo(() => {
    const score = [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /[a-z]/.test(form.password),
      /\d/.test(form.password),
      /[^A-Za-z\d]/.test(form.password),
    ].filter(Boolean).length;

    if (!form.password) return { label: 'Add a strong password', percent: 10, color: 'bg-slate-200' };
    if (score <= 2) return { label: 'Weak password', percent: 32, color: 'bg-red-500' };
    if (score === 3 || score === 4) return { label: 'Good password', percent: 68, color: 'bg-amber-400' };
    return { label: 'Strong password', percent: 100, color: 'bg-emerald-500' };
  }, [form.password]);

  const completion = Math.round(((step + 1) / STEP_LABELS.length) * 100);
  const isUploadingAnyFile = Object.values(uploadingFields).some(Boolean);
  const validationErrors = useMemo(() => getValidationErrors(form), [form]);

  useEffect(() => {
    const pincode = String(form.pincode || '').replace(/\D/g, '').trim();
    if (pincode.length !== 6) {
      setLocationSuggestions({ districts: [], cities: [] });
      setPincodeLookupMessage('');
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsLookingUpPincode(true);
      try {
        const response = await fetch(`/api/auth/pincode/${pincode}`);
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'No location found for this pincode');
        }

        const location = payload.data || {};
        const districts = Array.isArray(location.districts) ? location.districts : [];
        const cities = Array.isArray(location.cities) ? location.cities : [];
        const stateName = String(location.state || '').trim();

        setLocationSuggestions({ districts, cities });
        setForm((current) => ({
          ...current,
          state: stateName || current.state,
          district: districts[0] || current.district,
          city: cities[0] || current.city,
        }));
        setPincodeLookupMessage(`Loaded ${districts.length || 1} district option(s) for ${pincode}.`);
      } catch (_) {
        setLocationSuggestions({ districts: [], cities: [] });
        setPincodeLookupMessage('Could not auto-fill location from pincode. Enter the fields manually if needed.');
      } finally {
        setIsLookingUpPincode(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [form.pincode]);

  useEffect(() => {
    setForm((current) => {
      const allowedSpecialties = getSpecialtyOptions(current.clinicType);
      const filteredSpecialties = current.specialties.filter((specialty) => allowedSpecialties.includes(specialty));

      if (filteredSpecialties.length === current.specialties.length) {
        return current;
      }

      return {
        ...current,
        specialties: filteredSpecialties.length ? filteredSpecialties : current.specialties.includes('Other') && allowedSpecialties.includes('Other') ? ['Other'] : [],
      };
    });
  }, [form.clinicType]);

  const updateField = (key, value) => {
    setForm((current) => {
      if (key === 'phone' && value !== current.phone) {
        return {
          ...current,
          [key]: value,
          ownerOtp: '',
          isOwnerMobileVerified: false,
          isOwnerMobileReverifyRequired: current.isOwnerMobileVerified || current.isOwnerMobileReverifyRequired,
        };
      }

      if (key === 'email' && value !== current.email) {
        return {
          ...current,
          [key]: value,
          ownerEmailOtp: '',
          isOwnerEmailVerified: false,
          isOwnerEmailReverifyRequired: current.isOwnerEmailVerified || current.isOwnerEmailReverifyRequired,
        };
      }

      if (key === 'clinicType' && value !== current.clinicType) {
        return {
          ...current,
          [key]: value,
          clinicTypeOther: value === 'Other' ? current.clinicTypeOther : '',
          specialties: [],
          specialtyOther: '',
        };
      }

      if (key === 'pincode') {
        const normalizedPincode = String(value || '').replace(/\D/g, '').slice(0, 6);
        return {
          ...current,
          [key]: normalizedPincode,
          district: '',
          city: '',
        };
      }

      return { ...current, [key]: value };
    });
  };

  const removeUploadedValue = (field, valueToRemove = null) => {
    if (field === 'additionalDocuments') {
      setForm((current) => ({
        ...current,
        additionalDocuments: current.additionalDocuments.filter((item) => item !== valueToRemove),
      }));
      return;
    }

    updateField(field, '');
    if (uploadFieldConfig[field]?.image) {
      setUploadPreviews((current) => ({ ...current, [field]: '' }));
    }
  };

  const toggleChip = (key, value) => {
    setForm((current) => {
      const currentValues = current[key];
      const exists = currentValues.includes(value);
      const nextValues = exists ? currentValues.filter((item) => item !== value) : [...currentValues, value];

      if (key === 'specialties') {
        return {
          ...current,
          [key]: nextValues,
          specialtyOther: nextValues.includes('Other') ? current.specialtyOther : '',
        };
      }

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const updateSchedule = (index, patch) => {
    setForm((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    }));
  };

  const copyScheduleFromPreviousDay = (index) => {
    if (index <= 0) return;

    setForm((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;

        const previous = current.weeklySchedule[index - 1];
        if (!previous) return entry;

        return {
          ...entry,
          enabled: previous.enabled,
          openingTime: previous.openingTime,
          closingTime: previous.closingTime,
          breakStart: previous.breakStart,
          breakEnd: previous.breakEnd,
        };
      }),
    }));
  };

  const toggleBreakDetails = (day) => {
    setExpandedBreakDays((current) => ({ ...current, [day]: !current[day] }));
  };

  const setFieldUploading = (field, isUploading) => {
    setUploadingFields((current) => ({ ...current, [field]: isUploading }));
  };

  const uploadSingleFile = async (field, file) => {
    setFieldUploading(field, true);

    try {
      const response = await uploadClinicOwnerDocument(file, field);
      const uploadedUrl = response.data?.data?.url || '';

      if (!uploadedUrl) {
        throw new Error('Upload URL missing from response');
      }

      if (uploadFieldConfig[field]?.image) {
        setUploadPreviews((current) => ({ ...current, [field]: uploadedUrl }));
      }

      return uploadedUrl;
    } finally {
      setFieldUploading(field, false);
    }
  };

  const handleFileSelection = async (field, files) => {
    if (!files?.length) return;

    try {
      if (field === 'additionalDocuments') {
        setFieldUploading(field, true);
        const uploads = await Promise.all(Array.from(files).map((file) => uploadClinicOwnerDocument(file, field)));
        const values = uploads
          .map((response) => response.data?.data?.url)
          .filter(Boolean);

        setForm((current) => ({
          ...current,
          additionalDocuments: [...current.additionalDocuments, ...values.filter((value) => !current.additionalDocuments.includes(value))],
        }));
        toast.success(`${values.length} supporting document${values.length === 1 ? '' : 's'} uploaded`);
        return;
      }

      const file = files[0];
      const uploadedUrl = await uploadSingleFile(field, file);
      updateField(field, uploadedUrl);
      toast.success(`${uploadFieldConfig[field]?.label || 'File'} uploaded`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to upload document');
    } finally {
      setFieldUploading(field, false);
    }
  };

  const handlePin = useCallback((lat, lng) => {
    updateField('latitude', lat);
    updateField('longitude', lng);
    if (lat && lng && !form.googleMapsLocation) {
      updateField('googleMapsLocation', 'Clinic location pinned on map');
    }
    if (!lat && !lng) {
      // Clear pin
      setForm((current) => ({ ...current, latitude: '', longitude: '' }));
    }
  }, [form.googleMapsLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateField('latitude', coords.latitude.toFixed(6));
        updateField('longitude', coords.longitude.toFixed(6));
        if (!form.googleMapsLocation) {
          updateField('googleMapsLocation', 'Current clinic location pinned');
        }
        toast.success('Current location captured');
      },
      () => toast.error('Unable to fetch current location')
    );
  };

  const handleSendOwnerOtp = async () => {
    const normalizedPhone = normalizePhone(form.phone);
    if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
      toast.error('Enter a valid owner mobile number first');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await sendClinicOwnerOtp(normalizedPhone);
      const cooldownMatch = response.data?.message?.match(/(\d+)\sseconds/);
      setOtpCooldown(cooldownMatch ? Number(cooldownMatch[1]) : 60);
      setDevOtpHint(isDevMode ? response.data?.data?.devOtp || '' : '');
      toast.success('OTP sent to owner mobile number');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOwnerOtp = async () => {
    const normalizedPhone = normalizePhone(form.phone);
    if (!form.ownerOtp.trim()) {
      toast.error('Enter the OTP sent to the owner mobile number');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyClinicOwnerOtp(normalizedPhone, form.ownerOtp.trim());
      updateField('isOwnerMobileVerified', true);
      updateField('isOwnerMobileReverifyRequired', false);
      setDevOtpHint('');
      toast.success('Owner mobile verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSendOwnerEmailVerification = async () => {
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      toast.error('Enter a valid owner email address first');
      return;
    }

    setIsSendingEmailVerification(true);
    try {
      await sendClinicOwnerEmailVerification(form.email.trim(), form.ownerName.trim());
      toast.success('Verification code sent to the owner email address');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send verification email');
    } finally {
      setIsSendingEmailVerification(false);
    }
  };

  const handleVerifyOwnerEmailOtp = async () => {
    if (!form.email.trim() || !form.ownerEmailOtp.trim()) {
      toast.error('Enter the email verification code first');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      await verifyClinicOwnerEmailOtp(form.email.trim(), form.ownerEmailOtp.trim());
      updateField('isOwnerEmailVerified', true);
      updateField('isOwnerEmailReverifyRequired', false);
      setForm((current) => ({ ...current, ownerEmailOtp: '' }));
      toast.success('Owner email verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify email code');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const validateStep = (nextStep = step) => {
    const stepFields = {
      0: ['ownerName', 'phone', 'email', 'ownerOtp', 'emailVerification', 'password', 'confirmPassword'],
      1: ['clinicName', 'clinicType', 'clinicTypeOther', 'specialties', 'specialtyOther'],
      2: ['clinicAddress', 'city', 'district', 'state', 'pincode', 'clinicPhone', 'googleMapsLocation', 'consultationModes', 'weeklySchedule', 'averageConsultationTimeMinutes', 'appointmentSlotMinutes'],
      3: ['paymentMethods'],
      4: ['clinicRegistrationNumber', 'licenseDocumentUrl', 'medicalEstablishmentCertificateUrl', 'gstCertificateUrl'],
      5: ['confirmAccurate', 'agreeTerms', 'agreeVerification'],
    };

    return stepFields[nextStep]?.map((field) => validationErrors[field]).find(Boolean) || null;
  };

  const validateAllSteps = () => {
    const orderedFields = [
      'ownerName',
      'phone',
      'email',
      'ownerOtp',
      'emailVerification',
      'password',
      'confirmPassword',
      'clinicName',
      'clinicType',
      'clinicTypeOther',
      'specialties',
      'specialtyOther',
      'clinicAddress',
      'city',
      'district',
      'state',
      'pincode',
      'clinicPhone',
      'googleMapsLocation',
      'consultationModes',
      'weeklySchedule',
      'averageConsultationTimeMinutes',
      'appointmentSlotMinutes',
      'paymentMethods',
      'clinicRegistrationNumber',
      'licenseDocumentUrl',
      'medicalEstablishmentCertificateUrl',
      'gstCertificateUrl',
      'confirmAccurate',
      'agreeTerms',
      'agreeVerification',
    ];

    return orderedFields.map((field) => validationErrors[field]).find(Boolean) || null;
  };

  const goNext = () => {
    setShowValidation(true);
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStepDirection(1);
    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrevious = () => {
    setStepDirection(-1);
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowValidation(true);
    const specialtyOtherFromForm = String(new window.FormData(event.currentTarget).get('specialtyOther') || '').trim();
    const submissionForm = {
      ...form,
      specialtyOther: specialtyOtherFromForm || form.specialtyOther.trim(),
    };
    if (!form.isOwnerMobileVerified) {
      toast.error('Verify the owner mobile number before submitting');
      return;
    }
    if (!form.isOwnerEmailVerified) {
      toast.error('Verify the owner email before submitting');
      return;
    }
    const submissionValidationErrors = getValidationErrors(submissionForm);
    const orderedFields = [
      'ownerName',
      'phone',
      'email',
      'ownerOtp',
      'emailVerification',
      'password',
      'confirmPassword',
      'clinicName',
      'clinicType',
      'clinicTypeOther',
      'specialties',
      'specialtyOther',
      'clinicAddress',
      'city',
      'district',
      'state',
      'pincode',
      'clinicPhone',
      'googleMapsLocation',
      'consultationModes',
      'weeklySchedule',
      'averageConsultationTimeMinutes',
      'appointmentSlotMinutes',
      'paymentMethods',
      'clinicRegistrationNumber',
      'licenseDocumentUrl',
      'medicalEstablishmentCertificateUrl',
      'gstCertificateUrl',
      'confirmAccurate',
      'agreeTerms',
      'agreeVerification',
    ];
    const error = orderedFields.map((field) => submissionValidationErrors[field]).find(Boolean) || null;
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);

    try {
      const consultationTime =
        String(form.averageConsultationTimeMinutes) === 'custom'
          ? Number(form.customConsultationTime || 0)
          : Number(form.averageConsultationTimeMinutes);

      const payload = {
        ownerName: submissionForm.ownerName.trim(),
        phone: normalizePhone(submissionForm.phone),
        email: submissionForm.email.trim().toLowerCase(),
        password: submissionForm.password,
        confirmPassword: submissionForm.confirmPassword,
        ownerMobileVerified: submissionForm.isOwnerMobileVerified,
        ownerEmailVerified: submissionForm.isOwnerEmailVerified,
        clinicName: submissionForm.clinicName.trim(),
        clinicType: submissionForm.clinicType,
        clinicTypeOther: submissionForm.clinicTypeOther.trim(),
        clinicDescription: submissionForm.clinicDescription.trim(),
        specialties: submissionForm.specialties,
        specialtyOther: submissionForm.specialtyOther.trim(),
        numberOfDoctors: submissionForm.numberOfDoctors ? Number(submissionForm.numberOfDoctors) : undefined,
        clinicLogoUrl: submissionForm.clinicLogoUrl || '',
        clinicCoverImageUrl: submissionForm.clinicCoverImageUrl || '',
        clinicAddress: submissionForm.clinicAddress.trim(),
        landmark: submissionForm.landmark.trim(),
        city: submissionForm.city.trim(),
        district: submissionForm.district.trim(),
        state: submissionForm.state.trim(),
        pincode: submissionForm.pincode.trim(),
        googleMapsLocation: submissionForm.googleMapsLocation.trim(),
        latitude: submissionForm.latitude ? Number(submissionForm.latitude) : undefined,
        longitude: submissionForm.longitude ? Number(submissionForm.longitude) : undefined,
        clinicPhone: normalizePhone(submissionForm.clinicPhone),
        emergencyContactNumber: submissionForm.emergencyContactNumber ? normalizePhone(submissionForm.emergencyContactNumber) : '',
        alternateEmail: submissionForm.alternateEmail.trim(),
        consultationModes: submissionForm.consultationModes,
        weeklySchedule: submissionForm.weeklySchedule,
        averageConsultationTimeMinutes: consultationTime,
        appointmentSlotMinutes: Number(submissionForm.appointmentSlotMinutes),
        dailyPatientCapacity: submissionForm.dailyPatientCapacity ? Number(submissionForm.dailyPatientCapacity) : undefined,
        openingHours: buildOpeningHours(submissionForm.weeklySchedule),
        facilities: submissionForm.facilities,
        languagesSpoken: submissionForm.languagesSpoken,
        paymentMethods: submissionForm.paymentMethods,
        insuranceSupported: submissionForm.insuranceSupported,
        clinicRegistrationNumber: submissionForm.clinicRegistrationNumber.trim(),
        gstNumber: submissionForm.gstNumber.trim(),
        panNumber: submissionForm.panNumber.trim(),
        licenseDocumentUrl: submissionForm.licenseDocumentUrl,
        medicalEstablishmentCertificateUrl: submissionForm.medicalEstablishmentCertificateUrl,
        gstCertificateUrl: submissionForm.gstCertificateUrl || '',
        panCardUrl: submissionForm.panCardUrl || '',
        additionalDocuments: submissionForm.additionalDocuments,
      };

      const response = await registerClinicOwner(payload);
      const data = response.data?.data;

      window.localStorage.removeItem(DRAFT_KEY);
      setSuccessState({
        applicationId: data?.clinic?.id || 'PM-CLINIC-PENDING',
        status: data?.user?.status || 'PENDING',
        nextSteps: data?.nextSteps || [],
      });
      toast.success('Clinic application submitted successfully');
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        // Show each field error clearly
        apiErrors.forEach((item) => {
          const fieldLabel = item.field ? `[${item.field}] ` : '';
          toast.error(`${fieldLabel}${item.message}`, { duration: 6000 });
        });
      } else {
        toast.error(error.response?.data?.message || 'Unable to submit clinic application');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successState) {
    return (
      <StaffPortalLayout>
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-[0_30px_80px_rgba(37,99,235,0.08)] sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <span className="text-4xl">✓</span>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Pending Verification</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Clinic application submitted</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            You can sign in after registration, but booking and staff operations will remain restricted until your clinic is verified by PulseMate Admin.
          </p>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 text-left sm:grid-cols-3">
            <InfoStat title="Application ID" value={successState.applicationId} />
            <InfoStat title="Estimated review time" value="24 - 48 hours" />
            <InfoStat title="Current status" value={successState.status} />
          </div>

          {successState.nextSteps?.length ? (
            <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">What Happens Next</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                {successState.nextSteps.map((item) => (
                  <p key={item}>• {item}</p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/staff/login"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
            >
              Go to Login
            </Link>
            <Link
              to="/portal"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              Track Verification Status
            </Link>
          </div>
        </div>
      </StaffPortalLayout>
    );
  }

  return (
    <StaffPortalLayout containerClassName="mx-auto w-full max-w-[1680px] px-0 py-0 sm:px-0 lg:py-0 xl:px-0 2xl:max-w-[1840px] 2xl:px-0 2xl:py-0 3xl:max-w-[2048px]">
      <div className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="sticky top-3 z-10 mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_16px_40px_rgba(37,99,235,0.06)] backdrop-blur sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-600">Clinic registration</p>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Register Your Clinic</h1>
            </div>
            <div className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:block">{completion}% complete</div>
          </div>

          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#22c55e_100%)] transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>

          <RegistrationStepper currentStep={step} onStepChange={setStep} />
        </div>

        <div className="mt-6">
          {draftRestored ? (
          <div className="mb-5 rounded-[1.2rem] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Draft restored on this device.
          </div>
        ) : null}

          <div className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.07)]">
            <div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="animate-fade-up">
              {step === 0 && (
                <StepShell
                  title="Clinic Owner Information"
                  subtitle="Let's start with your personal details to create your owner account."
                  icon={
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                  }
                >
                  <div className="grid gap-6">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <FieldLabel label="Owner Full Name *" />
                        <div className="mt-2">
                          <FloatingInput label="Owner full name" value={form.ownerName} onChange={(value) => updateField('ownerName', value)} autoFocus />
                        </div>
                        {showValidation && validationErrors.ownerName ? <ErrorText message={validationErrors.ownerName} /> : null}
                      </div>

                      <div>
                        <FieldLabel label="Owner Mobile Number *" />
                        <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                          <div>
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                              <div className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-base font-semibold text-slate-700">+91</div>
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={(event) => updateField('phone', event.target.value)}
                                placeholder="10-digit mobile number"
                                className="w-full border-0 bg-transparent px-4 py-4 text-base text-slate-900 outline-none"
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              {form.isOwnerMobileVerified ? (
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs">OK</span>
                                  Mobile verified
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                  {form.isOwnerMobileReverifyRequired ? 'Verify mobile again' : 'Mobile not verified'}
                                </span>
                              )}
                              {isDevMode && devOtpHint ? <span className="text-xs font-semibold text-amber-600">Dev OTP: {devOtpHint}</span> : null}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={handleSendOwnerOtp}
                              disabled={isSendingOtp || otpCooldown > 0}
                              className="inline-flex min-h-[58px] w-full items-center justify-center rounded-[1.1rem] border border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSendingOtp ? 'Sending OTP...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
                            </button>
                            <button
                              type="button"
                              onClick={handleVerifyOwnerOtp}
                              disabled={isVerifyingOtp || form.isOwnerMobileVerified || !form.ownerOtp}
                              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[1.1rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isVerifyingOtp ? 'Verifying...' : form.isOwnerMobileVerified ? 'Verified' : form.isOwnerMobileReverifyRequired ? 'Verify mobile again' : 'Verify mobile'}
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 max-w-[220px]">
                          <FloatingInput
                            label="Enter OTP"
                            value={form.ownerOtp}
                            onChange={(value) => updateField('ownerOtp', value.replace(/[^\d]/g, '').slice(0, 6))}
                          />
                        </div>
                        {showValidation && validationErrors.phone ? <ErrorText message={validationErrors.phone} /> : null}
                        {showValidation && validationErrors.ownerOtp ? <ErrorText message={validationErrors.ownerOtp} /> : null}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <FieldLabel label="Email Address *" />
                        {form.isOwnerEmailVerified ? (
                          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Email verified</span>
                        ) : form.isOwnerEmailReverifyRequired ? (
                          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">Verify email again</span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <FloatingInput label="owner@clinic.com" value={form.email} onChange={(value) => updateField('email', value)} type="email" />
                        <button
                          type="button"
                          onClick={handleSendOwnerEmailVerification}
                          disabled={isSendingEmailVerification}
                          className="inline-flex min-h-[58px] items-center justify-center rounded-[1.1rem] border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSendingEmailVerification ? 'Sending code...' : form.isOwnerEmailVerified ? 'Resend verification code' : form.isOwnerEmailReverifyRequired ? 'Send verification code again' : 'Send verification code'}
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,220px)_auto]">
                        <FloatingInput
                          label="Enter email OTP"
                          value={form.ownerEmailOtp}
                          onChange={(value) => updateField('ownerEmailOtp', value.replace(/[^\d]/g, '').slice(0, 6))}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOwnerEmailOtp}
                          disabled={isVerifyingEmail || form.isOwnerEmailVerified || !form.ownerEmailOtp}
                          className="inline-flex min-h-[58px] items-center justify-center rounded-[1.1rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isVerifyingEmail ? 'Verifying...' : form.isOwnerEmailVerified ? 'Verified' : form.isOwnerEmailReverifyRequired ? 'Verify code again' : 'Verify code'}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>We verify this email using a one-time code.</span>
                        {isDevMode ? <span className="font-semibold text-blue-600">Check the backend terminal for the code in dev mode.</span> : null}
                        {isVerifyingEmail ? <span className="font-semibold text-amber-600">Verifying email...</span> : null}
                      </div>
                      {showValidation && validationErrors.email ? <ErrorText message={validationErrors.email} /> : null}
                      {showValidation && validationErrors.emailVerification ? <ErrorText message={validationErrors.emailVerification} /> : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div>
                      <FieldLabel label="Password *" />
                      <div className="mt-2">
                        <PasswordField
                          label="Password"
                          value={form.password}
                          onChange={(value) => updateField('password', value)}
                          show={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                        />
                      </div>
                      {showValidation && validationErrors.password ? <ErrorText message={validationErrors.password} /> : null}
                    </div>
                    <div>
                      <FieldLabel label="Confirm Password *" />
                      <div className="mt-2">
                        <PasswordField
                          label="Confirm password"
                          value={form.confirmPassword}
                          onChange={(value) => updateField('confirmPassword', value)}
                          show={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((current) => !current)}
                        />
                      </div>
                      {showValidation && validationErrors.confirmPassword ? <ErrorText message={validationErrors.confirmPassword} /> : null}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Password Strength</p>
                        <p className="mt-1 text-sm text-slate-600">Use 8+ characters with a mix of letters, numbers and symbols.</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">{passwordStrength.label.replace('password', '').trim() || passwordStrength.label}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((mark) => (
                        <div
                          key={mark}
                          className={`h-1.5 rounded-full ${
                            passwordStrength.percent >= mark ? passwordStrength.color : 'bg-slate-200'
                          } transition-all duration-300`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className={`rounded-full px-3 py-1 ${/[A-Z]/.test(form.password) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>Uppercase</span>
                      <span className={`rounded-full px-3 py-1 ${/[a-z]/.test(form.password) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>Lowercase</span>
                      <span className={`rounded-full px-3 py-1 ${/\d/.test(form.password) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>Number</span>
                      <span className={`rounded-full px-3 py-1 ${/[^A-Za-z\d]/.test(form.password) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>Special character</span>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                          <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4Z" />
                          <path d="m9.5 12 1.8 1.8 3.2-3.4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">We value your security</p>
                        <p className="mt-1 text-sm leading-7 text-slate-600">
                          We will send a One Time Password (OTP) to your mobile number for verification before your clinic application is created.
                        </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="inline-flex items-start gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.1 9a3 3 0 1 1 5.2 2c-.9.9-1.8 1.4-1.8 2.8" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Need help?</p>
                <Link to="/portal" className="text-xs font-medium text-blue-600 transition hover:text-blue-700">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell
                  title="Clinic Details"
                  subtitle="Tell us what kind of clinic you run, what care you provide, and how the clinic brand should appear."
                >
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <FloatingInput label="Clinic Name *" value={form.clinicName} onChange={(value) => updateField('clinicName', value)} autoFocus />
                      {showValidation && validationErrors.clinicName ? <ErrorText message={validationErrors.clinicName} /> : null}
                    </div>
                    <div>
                      <SelectField label="Clinic Type *" value={form.clinicType} options={CLINIC_TYPES} onChange={(value) => updateField('clinicType', value)} />
                      {showValidation && validationErrors.clinicType ? <ErrorText message={validationErrors.clinicType} /> : null}
                    </div>
                  </div>

                  {form.clinicType === 'Other' ? (
                    <div className="mt-5">
                      <FloatingInput
                        label="Specify Clinic Type *"
                        value={form.clinicTypeOther}
                        onChange={(value) => updateField('clinicTypeOther', value)}
                        placeholder="For example: Ambulatory Care Center"
                      />
                      {showValidation && validationErrors.clinicTypeOther ? <ErrorText message={validationErrors.clinicTypeOther} /> : null}
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <FloatingTextArea
                      label="Clinic Description / About Clinic"
                      value={form.clinicDescription}
                      onChange={(value) => updateField('clinicDescription', value)}
                      rows={4}
                    />
                  </div>

                  <div className="mt-5">
                    <FieldLabel
                      label="Specialties *"
                      helper={`Pick the main specialties for ${form.clinicType.toLowerCase()}.`}
                    />
                    <ChipGroup values={form.specialties} options={specialtyOptions} onToggle={(value) => toggleChip('specialties', value)} />
                    {showValidation && validationErrors.specialties ? <ErrorText message={validationErrors.specialties} /> : null}
                  </div>

                  {form.specialties.includes('Other') ? (
                    <div className="mt-5">
                      <FloatingInput
                        label="Specify Specialty *"
                        value={form.specialtyOther}
                        onChange={(value) => updateField('specialtyOther', value)}
                        name="specialtyOther"
                        placeholder="For example: Neonatology, Sports Medicine, Cosmetic Dentistry"
                      />
                      {showValidation && validationErrors.specialtyOther ? <ErrorText message={validationErrors.specialtyOther} /> : null}
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <FloatingInput
                      label="Number of Doctors"
                      value={form.numberOfDoctors}
                      onChange={(value) => updateField('numberOfDoctors', value.replace(/[^\d]/g, ''))}
                      type="text"
                    />
                    <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Brand Assets</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Uploading logo and cover image is optional now and can still be updated later from clinic settings.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <UploadField field="clinicLogoUrl" value={form.clinicLogoUrl} preview={uploadPreviews.clinicLogoUrl} onSelect={handleFileSelection} onRemove={removeUploadedValue} isUploading={uploadingFields.clinicLogoUrl} />
                    <UploadField field="clinicCoverImageUrl" value={form.clinicCoverImageUrl} preview={uploadPreviews.clinicCoverImageUrl} onSelect={handleFileSelection} onRemove={removeUploadedValue} isUploading={uploadingFields.clinicCoverImageUrl} />
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  title="Location & Operations"
                  subtitle="Capture where the clinic operates, how patients reach you, and how your schedule works through the week."
                >
                  <FloatingTextArea label="Clinic Address *" value={form.clinicAddress} onChange={(value) => updateField('clinicAddress', value)} rows={3} />
                  {showValidation && validationErrors.clinicAddress ? <ErrorText message={validationErrors.clinicAddress} /> : null}

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <FloatingInput label="Landmark" value={form.landmark} onChange={(value) => updateField('landmark', value)} />
                    <div>
                      <FloatingInput label="Clinic Phone Number *" value={form.clinicPhone} onChange={(value) => updateField('clinicPhone', value)} type="tel" />
                      {showValidation && validationErrors.clinicPhone ? <ErrorText message={validationErrors.clinicPhone} /> : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <FloatingInput
                        label="Pincode *"
                        value={form.pincode}
                        onChange={(value) => updateField('pincode', value)}
                        inputMode="numeric"
                        placeholder="6 digit pincode"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {locationSuggestions.districts.length || locationSuggestions.cities.length ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span aria-hidden="true">✅</span>
                            Location detected from pincode
                          </span>
                        ) : null}
                        <p className="text-xs font-medium text-slate-500">
                          {isLookingUpPincode
                            ? 'Looking up location...'
                            : pincodeLookupMessage || 'Type 6 digits to auto-fill location. If lookup fails, enter the fields manually.'}
                        </p>
                      </div>
                      {showValidation && form.pincode.replace(/\D/g, '').length >= 6 && validationErrors.pincode ? <ErrorText message={validationErrors.pincode} /> : null}
                    </div>
                    <div className="md:col-span-1">
                      <SelectField
                        label="State *"
                        value={form.state || 'Select state'}
                        options={['Select state', ...INDIAN_STATES]}
                        onChange={(value) => {
                          const selected = value === 'Select state' ? '' : value;
                          setForm((current) => ({
                            ...current,
                            state: selected,
                            district: '',
                            city: '',
                          }));
                          // Clear pincode-based suggestions so district/city become free-text inputs
                          setLocationSuggestions({ districts: [], cities: [] });
                          setPincodeLookupMessage('');
                        }}
                      />
                      {showValidation && validationErrors.state ? <ErrorText message={validationErrors.state} /> : null}
                    </div>
                    <div className="md:col-span-1">
                      {locationSuggestions.districts.length ? (
                        <SelectField
                          label="District *"
                          value={form.district || 'Select district'}
                          options={['Select district', ...locationSuggestions.districts]}
                          onChange={(value) => updateField('district', value === 'Select district' ? '' : value)}
                        />
                      ) : (
                        <FloatingInput
                          label="District *"
                          value={form.district}
                          onChange={(value) => updateField('district', value)}
                          placeholder="Enter district name"
                        />
                      )}
                      {showValidation && validationErrors.district ? <ErrorText message={validationErrors.district} /> : null}
                    </div>
                    <div className="md:col-span-1">
                      {locationSuggestions.cities.length ? (
                        <SelectField
                          label="City / Locality *"
                          value={form.city || 'Select city'}
                          options={['Select city', ...locationSuggestions.cities]}
                          onChange={(value) => updateField('city', value === 'Select city' ? '' : value)}
                        />
                      ) : (
                        <FloatingInput
                          label="City / Locality *"
                          value={form.city}
                          onChange={(value) => updateField('city', value)}
                          placeholder="Enter city or locality"
                        />
                      )}
                      {showValidation && validationErrors.city ? <ErrorText message={validationErrors.city} /> : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <FloatingInput
                      label="Google Maps Location"
                      value={form.googleMapsLocation}
                      onChange={(value) => updateField('googleMapsLocation', value)}
                      placeholder="Paste a Google Maps link or nearby landmark"
                    />
                    <FloatingInput label="Emergency Contact Number" value={form.emergencyContactNumber} onChange={(value) => updateField('emergencyContactNumber', value)} type="tel" />
                  </div>
                  {showValidation && validationErrors.googleMapsLocation ? <ErrorText message={validationErrors.googleMapsLocation} /> : null}

                  <div className="mt-5">
                    <FloatingInput label="Alternate Email" value={form.alternateEmail} onChange={(value) => updateField('alternateEmail', value)} type="email" />
                  </div>

                  <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Clinic Location</p>
                      <h3 className="mt-1.5 text-xl font-semibold text-slate-900">Pin on map</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Click anywhere on the map to drop a pin, drag it to fine-tune, or use your current location.
                      </p>
                    </div>
                    <ClinicLocationPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onPin={handlePin}
                    />
                  </div>

                  <div className="hidden">
                    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Map Preview</p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">Live location snapshot</h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Use Current Location
                        </button>
                      </div>
                      <div className="mt-5 rounded-[1.6rem] bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Pinned Clinic Point</p>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                              {form.googleMapsLocation || 'Add a Google Maps link or use current location to help admin review your clinic address faster.'}
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">📍</div>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <FloatingInput label="Latitude" value={form.latitude} onChange={(value) => updateField('latitude', value)} />
                          <FloatingInput label="Longitude" value={form.longitude} onChange={(value) => updateField('longitude', value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.6rem] border border-slate-100 bg-slate-50 p-5">
                    <FieldLabel label="Consultation Modes" helper="Select the ways patients can see the clinic." />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {CONSULTATION_MODES.map((option) => {
                        const active = form.consultationModes.includes(option);
                        return (
                          <button
                            type="button"
                            key={option}
                            onClick={() => toggleChip('consultationModes', option)}
                            className={`rounded-[1.25rem] border p-4 text-left transition ${
                              active ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                                  {CONSULTATION_MODE_ICONS[option] || '•'}
                                </span>
                                <div>
                                  <p className="font-semibold">{option.replace(' Consultation', '')}</p>
                                  <p className="text-xs text-slate-500">
                                    {option === 'Offline Consultation'
                                      ? 'In-clinic visits'
                                      : option === 'Video Consultation'
                                        ? 'Virtual appointments'
                                        : option === 'Home Visit'
                                          ? 'At-home care'
                                          : 'Quick text support'}
                                  </p>
                                </div>
                              </div>
                              {active ? <span className="text-sm font-semibold text-blue-600">✓</span> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {showValidation && validationErrors.consultationModes ? <ErrorText message={validationErrors.consultationModes} /> : null}
                  </div>

                  <div className="mt-6">
                    <FieldLabel label="Weekly Timings" helper="One row per day, with break details only when needed." />
                    <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm">
                      <div className="hidden grid-cols-[110px_110px_minmax(0,1fr)_120px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                        <div>Day</div>
                        <div>Status</div>
                        <div>Hours</div>
                        <div>Break</div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {form.weeklySchedule.map((entry, index) => {
                          const showBreakRow = expandedBreakDays[entry.day] || entry.breakStart || entry.breakEnd;
                          return (
                            <div key={entry.day} className="p-4">
                              <div className="grid gap-3 lg:grid-cols-[110px_110px_minmax(0,1fr)_120px] lg:items-start">
                                <div className="flex items-center justify-between gap-3 lg:block">
                                  <p className="text-base font-semibold text-slate-900">{entry.day}</p>
                                  {index > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => copyScheduleFromPreviousDay(index)}
                                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 lg:mt-2"
                                    >
                                      Copy previous
                                    </button>
                                  ) : null}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => updateSchedule(index, { enabled: !entry.enabled })}
                                  className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold ${
                                    entry.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {entry.enabled ? 'Open' : 'Closed'}
                                </button>

                                <div className="space-y-2">
                                  <div className="grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] gap-2">
                                    <MiniTimeField
                                      label="Opening"
                                      value={entry.openingTime}
                                      disabled={!entry.enabled}
                                      onChange={(value) => updateSchedule(index, { openingTime: value })}
                                    />
                                    <div className="flex items-end justify-center pb-3 text-sm font-semibold text-slate-400">→</div>
                                    <MiniTimeField
                                      label="Closing"
                                      value={entry.closingTime}
                                      disabled={!entry.enabled}
                                      onChange={(value) => updateSchedule(index, { closingTime: value })}
                                    />
                                  </div>
                                  <p className="text-xs font-medium text-slate-500">
                                    {entry.enabled ? 'Working hours set for the day.' : 'Closed today.'}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleBreakDetails(entry.day)}
                                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                                  >
                                    {showBreakRow ? 'Hide break' : 'Break optional'}
                                  </button>
                                  {showBreakRow ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <MiniTimeField
                                        label="Start"
                                        value={entry.breakStart}
                                        disabled={!entry.enabled}
                                        onChange={(value) => updateSchedule(index, { breakStart: value })}
                                      />
                                      <MiniTimeField
                                        label="End"
                                        value={entry.breakEnd}
                                        disabled={!entry.enabled}
                                        onChange={(value) => updateSchedule(index, { breakEnd: value })}
                                      />
                                    </div>
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-medium text-slate-500">
                                      Optional break
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {showValidation && validationErrors.weeklySchedule ? <ErrorText message={validationErrors.weeklySchedule} /> : null}
                  </div>

                  <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Scheduling Settings</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Queue and appointment speed</h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Quick setup</span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <SelectField
                        label="Average Consultation Time *"
                        value={String(form.averageConsultationTimeMinutes)}
                        options={CONSULTATION_TIME_OPTIONS.map((value) => String(value))}
                        optionLabel={(value) => `${value} min`}
                        onChange={(value) => updateField('averageConsultationTimeMinutes', Number(value))}
                      />
                      <div>
                        <p className="mb-2 text-sm font-semibold text-slate-900">Appointment Slot Duration *</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {SLOT_DURATION_OPTIONS.map((value) => {
                            const active = String(form.appointmentSlotMinutes) === String(value);
                            return (
                              <button
                                type="button"
                                key={value}
                                onClick={() => updateField('appointmentSlotMinutes', Number(value))}
                                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                                  active ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200'
                                }`}
                              >
                                {value} min
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <FloatingInput
                        label="Daily Patient Capacity"
                        value={form.dailyPatientCapacity}
                        onChange={(value) => updateField('dailyPatientCapacity', value.replace(/[^\d]/g, ''))}
                      />
                    </div>
                  </div>
                  {showValidation && validationErrors.averageConsultationTimeMinutes ? <ErrorText message={validationErrors.averageConsultationTimeMinutes} /> : null}
                  {showValidation && validationErrors.appointmentSlotMinutes ? <ErrorText message={validationErrors.appointmentSlotMinutes} /> : null}
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  title="Facilities & Patient Services"
                  subtitle="Add the conveniences and access options patients will expect to see before trusting the clinic."
                >
                  <FieldLabel label="Facilities" helper="Choose every facility available at the clinic." />
                  <ToggleCardGrid values={form.facilities} options={FACILITIES} onToggle={(value) => toggleChip('facilities', value)} />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div>
                      <FieldLabel label="Languages Spoken" helper="These can be updated later from profile settings." />
                      <ChipGroup values={form.languagesSpoken} options={LANGUAGES} onToggle={(value) => toggleChip('languagesSpoken', value)} />
                    </div>
                    <div>
                      <FieldLabel label="Payment Methods *" helper="Select accepted payment types." />
                      <CheckboxGroup values={form.paymentMethods} options={PAYMENT_METHODS} onToggle={(value) => toggleChip('paymentMethods', value)} />
                      {showValidation && validationErrors.paymentMethods ? <ErrorText message={validationErrors.paymentMethods} /> : null}
                    </div>
                  </div>

                  <div className="mt-6">
                    <FieldLabel label="Insurance Supported" helper="Optional. Add insurance providers that patients can use at the clinic." />
                    <ChipGroup values={form.insuranceSupported} options={INSURANCE_OPTIONS} onToggle={(value) => toggleChip('insuranceSupported', value)} />
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  title="Verification & Compliance"
                  subtitle="Submit legal identifiers and verification documents used by the PulseMate admin team before activation."
                >
                  <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 text-amber-900">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">Review Notice</p>
                    <p className="mt-2 text-sm leading-7">
                      Your clinic will be reviewed by PulseMate admin before activation. Legal identifiers and owner contact details become restricted after verification.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <FloatingInput
                      label="Clinic Registration Number *"
                      value={form.clinicRegistrationNumber}
                      onChange={(value) => updateField('clinicRegistrationNumber', value)}
                    />
                    {showValidation && validationErrors.clinicRegistrationNumber ? <ErrorText message={validationErrors.clinicRegistrationNumber} /> : null}
                    <FloatingInput label="GST Number" value={form.gstNumber} onChange={(value) => updateField('gstNumber', value)} />
                    <FloatingInput label="PAN Number" value={form.panNumber} onChange={(value) => updateField('panNumber', value)} />
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <UploadField field="licenseDocumentUrl" value={form.licenseDocumentUrl} preview={uploadPreviews.licenseDocumentUrl} onSelect={handleFileSelection} onRemove={removeUploadedValue} isUploading={uploadingFields.licenseDocumentUrl} error={showValidation ? validationErrors.licenseDocumentUrl : ''} />
                    <UploadField
                      field="medicalEstablishmentCertificateUrl"
                      value={form.medicalEstablishmentCertificateUrl}
                      preview={uploadPreviews.medicalEstablishmentCertificateUrl}
                      onSelect={handleFileSelection}
                      onRemove={removeUploadedValue}
                      isUploading={uploadingFields.medicalEstablishmentCertificateUrl}
                      error={showValidation ? validationErrors.medicalEstablishmentCertificateUrl : ''}
                    />
                    <UploadField field="gstCertificateUrl" value={form.gstCertificateUrl} preview={uploadPreviews.gstCertificateUrl} onSelect={handleFileSelection} onRemove={removeUploadedValue} isUploading={uploadingFields.gstCertificateUrl} error={showValidation ? validationErrors.gstCertificateUrl : ''} />
                    <UploadField field="panCardUrl" value={form.panCardUrl} preview={uploadPreviews.panCardUrl} onSelect={handleFileSelection} onRemove={removeUploadedValue} isUploading={uploadingFields.panCardUrl} />
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <FieldLabel label="Additional Documents" helper="Add extra supporting files if needed." />
                    <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.3rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
                      <span className="text-3xl">+</span>
                      <span className="mt-3 text-base font-semibold text-slate-900">Drop or browse supporting documents</span>
                      <span className="mt-2 text-sm text-slate-500">PDF, JPG, PNG, or WEBP supported.</span>
                      <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(event) => handleFileSelection('additionalDocuments', event.target.files)} />
                    </label>
                    {uploadingFields.additionalDocuments ? <p className="mt-3 text-sm font-semibold text-blue-600">Uploading supporting documents...</p> : null}
                    {form.additionalDocuments.length ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {form.additionalDocuments.map((item) => (
                          <button key={item} type="button" onClick={() => removeUploadedValue('additionalDocuments', item)} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100">
                            {renderFileName(item)} x
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
                    Uploaded documents are stored on the server and linked to this clinic application.
                  </div>
                </StepShell>
              )}

              {step === 5 && (
                <StepShell
                  title="Review Your Application"
                  subtitle="Review each section before you submit. You can edit details now, and only selected profile fields remain editable after verification."
                >
                  {showValidation && (validationErrors.confirmAccurate || validationErrors.agreeTerms || validationErrors.agreeVerification) ? (
                    <div className="mb-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Please finish the remaining review items before submitting.</p>
                      <div className="mt-2 space-y-1">
                        {[validationErrors.confirmAccurate, validationErrors.agreeTerms, validationErrors.agreeVerification].filter(Boolean).map((message) => (
                          <p key={message}>- {message}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-4 xl:grid-cols-2">
                    {summaryItems.map((item) => (
                      <SummaryCard key={item.title} item={item} form={form} onEdit={() => setStep(item.step)} />
                    ))}
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-900">Terms & Compliance</p>
                    <div className="mt-4 space-y-3">
                      <CheckRow checked={form.confirmAccurate} onChange={(value) => updateField('confirmAccurate', value)} label="I confirm all clinic information is accurate." />
                      {showValidation && validationErrors.confirmAccurate ? <ErrorText message={validationErrors.confirmAccurate} /> : null}
                      <CheckRow checked={form.agreeTerms} onChange={(value) => updateField('agreeTerms', value)} label="I agree to PulseMate Terms & Conditions." />
                      {showValidation && validationErrors.agreeTerms ? <ErrorText message={validationErrors.agreeTerms} /> : null}
                      <CheckRow checked={form.agreeVerification} onChange={(value) => updateField('agreeVerification', value)} label="I agree to clinic verification and compliance review." />
                      {showValidation && validationErrors.agreeVerification ? <ErrorText message={validationErrors.agreeVerification} /> : null}
                    </div>
                  </div>
                </StepShell>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {step === 0 ? (
                  <Link
                    to="/portal"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Cancel
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Previous
                  </button>
                )}
                <div className="text-sm font-medium text-slate-500">
                  Step {step + 1} of {STEP_LABELS.length}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {step < STEP_LABELS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
                  >
                    Save & Continue
                    <span aria-hidden="true">-&gt;</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || isUploadingAnyFile || !form.isOwnerMobileVerified || !form.isOwnerEmailVerified}
                    className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#22c55e_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_42px_rgba(37,99,235,0.2)] transition hover:brightness-105 disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting Clinic Application...' : isUploadingAnyFile ? 'Waiting For Uploads...' : 'Submit Clinic Application'}
                  </button>
                )}
              </div>
            </div>
              </form>

            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Your progress is saved automatically. You can exit anytime and continue later.
          </p>
        </div>
      </div>
    </StaffPortalLayout>
  );
};

const RegistrationStepper = ({ currentStep, onStepChange }) => (
  <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
    {STEP_LABELS.map((label, index) => {
      const active = index === currentStep;
      const complete = index < currentStep;

      return (
        <button
          key={label}
          type="button"
          onClick={() => complete && onStepChange(index)}
          className={`relative flex flex-col items-center text-center px-1 ${
            complete ? 'cursor-pointer' : active ? 'cursor-default' : 'cursor-not-allowed'
          }`}
        >
          {index < STEP_LABELS.length - 1 ? (
            <span className="absolute left-[calc(50%+1rem)] top-4 hidden h-px w-[calc(100%-2rem)] border-t border-dashed border-blue-200 lg:block" />
          ) : null}
          <span
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
              active
                ? 'border-blue-600 bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]'
                : complete
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {index + 1}
          </span>
          <span className={`mt-2 text-[11px] font-semibold leading-4 ${active ? 'text-blue-600' : 'text-slate-600'}`}>{label}</span>
        </button>
      );
    })}
  </div>
);

const StepShell = ({ title, subtitle, icon, children }) => (
  <section>
    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#eaf2ff_0%,#dbeafe_100%)] text-blue-600 shadow-inner sm:h-14 sm:w-14">
        {icon || <span className="text-xl">+</span>}
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>
      </div>
    </div>
    <div className="pt-4">{children}</div>
  </section>
);

const FieldLabel = ({ label, helper }) => (
  <div>
    <p className="text-sm font-semibold text-slate-900">{label}</p>
    {helper ? <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p> : null}
  </div>
);

const ErrorText = ({ message }) => (
  <p className="mt-2 text-sm font-medium text-red-600">{message}</p>
);

const toPlaceholder = (label = '') =>
  String(label)
    .replace(/\*/g, '')
    .trim()
    .replace(/\s+/g, ' ');

const placeholderExamples = {
  'Owner full name': 'Rahul Sharma',
  'Enter OTP': '123456',
  'owner@clinic.com': 'owner@sunriseclinic.com',
  'Password': 'Create a strong password',
  'Confirm password': 'Re-enter your password',
  'Clinic Name': 'Sunrise Multispecialty Clinic',
  'Clinic Description / About Clinic': 'Describe your clinic, specialties, and services',
  'Clinic Address': 'House no., street, area',
  'Landmark': 'Near City Hospital',
  'Clinic Phone Number': '9876543210',
  'Google Maps Location': 'Paste Google Maps link or nearby landmark',
  'Emergency Contact Number': '9876543210',
  'Alternate Email': 'support@sunriseclinic.com',
  'Latitude': '28.6139',
  'Longitude': '77.2090',
  'Number of Doctors': '5',
  'Clinic Registration Number': 'REG-2026-001',
  'GST Number': '27ABCDE1234F1Z5',
  'PAN Number': 'ABCDE1234F',
};

const getPlaceholder = (label, fallback = 'Enter details') => {
  const cleanLabel = toPlaceholder(label);
  return placeholderExamples[cleanLabel] || placeholderExamples[String(label).trim()] || fallback;
};

const FloatingInput = ({ label, value, onChange, type = 'text', placeholder, autoFocus = false, ...props }) => {
  const resolvedPlaceholder =
    typeof placeholder === 'string' && placeholder.trim() ? placeholder : getPlaceholder(label, `Enter ${toPlaceholder(label)}`);

  return (
    <label className="block">
      <input
        type={type}
        {...props}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={label}
        className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
};

const FloatingTextArea = ({ label, value, onChange, rows = 4 }) => (
  <label className="block">
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={getPlaceholder(label, `Enter ${toPlaceholder(label)}`)}
      aria-label={label}
      className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

const PasswordField = ({ label, value, onChange, show, onToggle }) => (
  <label className="block">
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={getPlaceholder(label, toPlaceholder(label))}
        aria-label={label}
        className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3.5 pr-20 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  </label>
);

const SelectField = ({ label, value, options, onChange, optionLabel = (value) => value }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-900">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {optionLabel(option)}
        </option>
      ))}
    </select>
  </label>
);

const MiniTimeField = ({ label, value, onChange, disabled }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
    <input
      type="time"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  </label>
);

const ChipGroup = ({ values, options, onToggle }) => (
  <div className="mt-4 flex flex-wrap gap-3">
    {options.map((option) => {
      const active = values.includes(option);
      return (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            active ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600'
          }`}
        >
          {option}
        </button>
      );
    })}
  </div>
);

const CheckboxGroup = ({ values, options, onToggle }) => (
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
    {options.map((option) => {
      const active = values.includes(option);
      return (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`flex items-center justify-between rounded-[1.2rem] border px-4 py-3 text-left transition ${
            active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <span className="font-medium">{option}</span>
          <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>✓</span>
        </button>
      );
    })}
  </div>
);

const ToggleCardGrid = ({ values, options, onToggle }) => (
  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {options.map((option) => {
      const active = values.includes(option);
      return (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`rounded-[1.4rem] border p-4 text-left shadow-sm transition ${
            active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">{option}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {active ? 'Added' : 'Add'}
            </span>
          </div>
        </button>
      );
    })}
  </div>
);

const UploadField = ({ field, value, preview, onSelect, onRemove, isUploading, error }) => {
  const config = uploadFieldConfig[field];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <FieldLabel label={config.label} helper={config.helper} />
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.3rem] border border-dashed border-slate-300 bg-white px-5 py-7 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
        {preview ? (
          <img src={preview} alt={config.label} className="h-28 w-full rounded-2xl object-cover shadow-sm" />
        ) : (
          <UploadBadge iconType={config.image ? 'image' : 'file'} />
        )}
        <span className="mt-3 text-base font-semibold text-slate-900">{value ? renderFileName(value) : `Upload ${config.label.replace(' *', '')}`}</span>
        <span className="mt-2 text-sm text-slate-500">
          {isUploading ? 'Uploading...' : value ? 'Replace file' : 'Drag and drop or browse files'}
        </span>
        <input type="file" accept={config.accept} className="hidden" onChange={(event) => onSelect(field, event.target.files)} />
      </label>
      {value ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <span className="truncate">Uploaded: {renderFileName(value)}</span>
          <button type="button" onClick={() => onRemove(field)} className="shrink-0 font-semibold text-red-600 transition hover:text-red-700">
            Remove
          </button>
        </div>
      ) : null}
      {error ? <ErrorText message={error} /> : null}
    </div>
  );
};

const UploadBadge = ({ iconType }) => (
  <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] text-blue-600 shadow-sm">
    {iconType === 'image' ? (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <path d="M8 14l2.5-2.5a1.5 1.5 0 0 1 2.2.1L15 14" />
        <circle cx="9" cy="9" r="1.2" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v10" />
        <path d="m8.5 6.5 3.5-3.5 3.5 3.5" />
        <path d="M5.5 14.5v3A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-3" />
      </svg>
    )}
  </div>
);

const SummaryCard = ({ item, form, onEdit }) => (
  <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-lg font-semibold text-slate-900">{item.title}</p>
        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {item.fields.map((field) => (
            <p key={field}>
              <span className="font-semibold text-slate-800">{formatFieldLabel(field)}:</span> {formatSummaryValue(form[field])}
            </p>
          ))}
        </div>
      </div>
      <button type="button" onClick={onEdit} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50">
        Edit
      </button>
    </div>
  </div>
);

const CheckRow = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
    <span className="text-sm leading-6 text-slate-700">{label}</span>
  </label>
);

const InfoStat = ({ title, value }) => (
  <div className="rounded-[1.3rem] border border-white bg-white px-4 py-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
  </div>
);

const formatFieldLabel = (field) =>
  field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const formatSummaryValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.map((item) => (typeof item === 'string' ? renderFileName(item) : item)).join(', ') : 'Not added';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return 'Not added';
  if (typeof value === 'string' && isHttpUrl(value)) return value;
  return typeof value === 'string' ? renderFileName(value) : String(value);
};

export default ClinicOwnerRegisterPage;
