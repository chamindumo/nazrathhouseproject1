import React, { useState } from 'react';
import { User, Phone, Home, UserCheck, Smartphone } from 'lucide-react';
import { Visitor } from '../../types';

interface VisitorFormProps {
  onNext: (visitorData: Partial<Visitor>) => void;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({ onNext }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    relationship: 'Other',
    residentName: '',
    roomNumber: '',
    emergencyContact: 'None',
    emergencyPhone: 'None',
    accessLevel: 'friend' as Visitor['accessLevel'],
    photoUrl: '',
    notes: '',
    visitorIdNumber: '',
    visitorMeetingSelection: '' as Visitor['visitorMeetingSelection'],
    visitorCategory: '',
    staffDepartment: '',
    visitPurpose: 'Personal Visit',
    appointmentType: 'walk-in' as Visitor['appointmentType'],
  });

  const visitorMeetingOptions = [
    { value: 'resident', label: 'Resident' },
    { value: 'staff', label: 'Staff' },
    { value: 'sisters', label: 'Sisters' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phoneNumber // Keep for compatibility if needed elsewhere
    });
  };

  const isFormValid = formData.firstName && formData.lastName && formData.phoneNumber && 
    formData.visitorIdNumber && formData.visitorMeetingSelection &&
    (formData.visitorMeetingSelection !== 'resident' || (formData.residentName && formData.roomNumber));

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
        <div className="flex items-center space-x-4 mb-10">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl shadow-inner">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Visitor Quick Check-In</h2>
            <p className="text-gray-500 text-lg">Quickly register your visit</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                placeholder="(555) 000-0000"
                required
              />
            </div>
          </div>

          {/* ID Section */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              ID Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.visitorIdNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, visitorIdNumber: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-lg"
                placeholder="ID Card Number"
                required
              />
            </div>
          </div>

          {/* Meeting Selection */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              Who are you meeting?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {visitorMeetingOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visitorMeetingSelection: option.value as any }))}
                  className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                    formData.visitorMeetingSelection === option.value
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resident Details */}
          {formData.visitorMeetingSelection === 'resident' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-blue-700 uppercase">Resident Name</label>
                  <input
                    type="text"
                    value={formData.residentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, residentName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-blue-200 focus:border-blue-500 rounded-xl outline-none"
                    placeholder="Resident's Full Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-blue-700 uppercase">Room Number</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 focus:border-blue-500 rounded-xl outline-none"
                      placeholder="e.g. A-101"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl transition-all ${
                isFormValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:-translate-y-1'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Finish Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};