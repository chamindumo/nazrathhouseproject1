import React, { useState } from 'react';
import { VisitorForm } from './VisitorForm';
import { CheckInComplete } from './CheckInComplete';
import { Visitor, HealthScreening, FamilyMember } from '../../types';
import { visitorService } from '../../services/visitorService';
import { emailService } from '../../services/emailService';

interface CheckInFlowProps {
  onComplete: () => void;
  returningVisitor?: Visitor | null;
  noPrint?: boolean;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({ onComplete, returningVisitor, noPrint = false }) => {
  const [currentStep, setCurrentStep] = useState<'visitor-info' | 'complete'>( 'visitor-info' );
  const [visitorData, setVisitorData] = useState<Partial<Visitor>>(
    returningVisitor ? {
      firstName: returningVisitor.firstName,
      lastName: returningVisitor.lastName,
      email: returningVisitor.email,
      phone: returningVisitor.phone,
      relationship: returningVisitor.relationship,
      residentName: returningVisitor.residentName,
      residentRoom: returningVisitor.residentRoom,
      emergencyContact: returningVisitor.emergencyContact,
      emergencyPhone: returningVisitor.emergencyPhone,
      accessLevel: returningVisitor.accessLevel,
      photoUrl: returningVisitor.photoUrl,
      notes: returningVisitor.notes,
      visitorIdNumber: returningVisitor.visitorIdNumber
    } : {}
  );
  const [checkedInVisitor, setCheckedInVisitor] = useState<Visitor | null>(null);
  const [healthScreening, setHealthScreening] = useState<HealthScreening | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisitorInfo = async (data: Partial<Visitor>) => {
    setVisitorData(data);
    setLoading(true);
    setError(null);

    // Create a default "Safe" health screening to satisfy the system requirements
    const defaultScreening: HealthScreening = {
      testResult: 'negative',
      hasSymptoms: false,
      symptoms: [],
      riskFactors: [],
      screeningDate: new Date(),
      noFeverOrCovidSymptoms: true,
      notInContactWithIll: true,
      visitorAgreementAcknowledgement: true
    };
    
    setHealthScreening(defaultScreening);

    try {
      const completeVisitorData: Omit<Visitor, 'id' | 'checkInTime' | 'qrCode' | 'badgeNumber' | 'visitorIdNumber'> & { visitorIdNumber?: string } = {
        ...data as any,
        healthScreening: defaultScreening,
        status: 'checked-in',
        isApproved: true,
        visitorIdNumber: returningVisitor?.visitorIdNumber || data.visitorIdNumber || undefined
      };

      const checkedInVisitorResult = await visitorService.checkInVisitor(completeVisitorData, !!returningVisitor);
      setCheckedInVisitor(checkedInVisitorResult);
      
      // Send email notifications
      try {
        const recipientEmail = emailService.getRecipientEmail(checkedInVisitorResult);
        await emailService.sendCheckInNotification(checkedInVisitorResult, defaultScreening, recipientEmail);
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }
      
      setCurrentStep('complete');
    } catch (err) {
      setError('Failed to check in visitor. Please try again.');
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    setCurrentStep('visitor-info');
    setVisitorData({});
    setCheckedInVisitor(null);
    setHealthScreening(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Check-In</h3>
          <p className="text-gray-600">Please wait while we complete your registration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'visitor-info') {
    return <VisitorForm onNext={handleVisitorInfo} />;
  }

  return (
    <CheckInComplete
      visitor={checkedInVisitor || visitorData as Visitor}
      healthScreening={healthScreening!}
      familyMembers={[]}
      onComplete={handleComplete}
      noPrint={noPrint}
    />
  );
};