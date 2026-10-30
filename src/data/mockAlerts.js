export const mockAlerts = [
  {
    id: 1,
    type: 'call',
    number: '+91 98876 43210',
    preview: 'This is a bank representative. Please share your OTP.',
    risk: 'HIGH',
    reason: 'Bank impersonation attempt',
    action: 'Do not share the OTP. Call the bank using the number on your card.',
    time: 'Today, 9:15 AM',
  },
  {
    id: 2,
    type: 'sms',
    number: 'KYC Update',
    preview: 'Your account is blocked. Pay ₹250 to unblock it now.',
    risk: 'HIGH',
    reason: 'Threat and payment demand',
    action: 'Do not pay. Ask a trusted family member to verify.',
    time: 'Today, 8:40 AM',
  },
  {
    id: 3,
    type: 'call',
    number: '+91 77321 19580',
    preview: 'We are from a courier service. Your package is pending.',
    risk: 'MEDIUM',
    reason: 'Suspicious request for personal information',
    action: 'Ask them to send a message and verify the company details.',
    time: 'Yesterday, 6:15 PM',
  },
]

export const recentAlerts = [
  { label: 'Safe', message: 'No suspicious activity detected today.', tone: 'safe' },
  { label: 'Be Careful', message: 'One link message was blocked earlier.', tone: 'warn' },
  { label: 'High Risk', message: 'A suspicious call asked for OTP.', tone: 'danger' },
]
