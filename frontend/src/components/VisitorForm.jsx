import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VisitorForm({ initialData, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    company: initialData?.company || '',
    jobTitle: initialData?.jobTitle || '',
    phone: initialData?.phone || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Full Name is required.';
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Work Email is required.';
        } else if (!validateEmail(value)) {
          error = 'Please enter a valid email address (e.g. user@company.com).';
        }
        break;
      case 'company':
        if (!value.trim()) error = 'Company Name is required.';
        break;
      case 'jobTitle':
        if (!value.trim()) error = 'Job Title is required.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.email = validateField('email', formData.email);
    newErrors.company = validateField('company', formData.company);
    newErrors.jobTitle = validateField('jobTitle', formData.jobTitle);

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      company: true,
      jobTitle: true,
    });

    return !Object.values(newErrors).some((err) => err !== '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit(formData);
    }
  };

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    validateEmail(formData.email) &&
    formData.company.trim() !== '' &&
    formData.jobTitle.trim() !== '';

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Step 1 of 2</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Visitor Details</span>
      </div>

      <h2 className="step-title">Tell Us About Yourself</h2>
      <p className="step-subtitle">
        Enter your details to schedule a tailored 30-minute demonstration of QGuard.
      </p>

      <form onSubmit={handleSubmit} className="form-card" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full Name <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="name"
              name="name"
              type="text"
              className={`form-input ${errors.name ? 'has-error' : ''}`}
              placeholder="e.g. Sarah Connor"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          {errors.name && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Work Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Work Email <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'has-error' : ''}`}
              placeholder="sarah@company.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          {errors.email && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        {/* Company */}
        <div className="form-group">
          <label className="form-label" htmlFor="company">
            Company Name <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="company"
              name="company"
              type="text"
              className={`form-input ${errors.company ? 'has-error' : ''}`}
              placeholder="Cyberdyne Systems"
              value={formData.company}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          {errors.company && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{errors.company}</span>
            </div>
          )}
        </div>

        {/* Job Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="jobTitle">
            Job Title <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              className={`form-input ${errors.jobTitle ? 'has-error' : ''}`}
              placeholder="Chief Security Officer"
              value={formData.jobTitle}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
          {errors.jobTitle && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{errors.jobTitle}</span>
            </div>
          )}
        </div>

        {/* Phone (Optional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            Phone Number <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Optional)</span>
          </label>
          <div className="input-wrapper">
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-input"
              placeholder="+1 (555) 019-2834"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack} id="btn-back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={!isFormValid}
            style={{ opacity: isFormValid ? 1 : 0.6, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
            id="btn-continue-to-time"
          >
            <span>Continue to Time Slots</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
