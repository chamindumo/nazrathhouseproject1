import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, we'd verify the username and email, maybe send a code.
      // For this implementation, we'll move to step 2 if the user exists.
      const user = await authService.getUserByUsername(formData.username);
      if (!user || user.email !== formData.email) {
        throw new Error('No user found with these details');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(formData.username, formData.email, formData.newPassword);
      setSuccess('Your password has been reset successfully!');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Follow the steps to regain access to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onBackToLogin}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
            <div className="flex space-x-2">
              <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-green-900">Success!</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
              <p className="mt-4 text-xs text-gray-500 italic">Redirecting to login...</p>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your username"
                  />
                  <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Identity'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="bg-blue-50 p-3 rounded-md mb-4 flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <p className="text-sm text-blue-700">Identity verified! Please choose a new secure password.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
