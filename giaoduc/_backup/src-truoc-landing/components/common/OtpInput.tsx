import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6 }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure value doesn't exceed length
  const safeValue = value.slice(0, length);
  // Pad with empty strings for uncontrolled spaces
  const otpArray = safeValue.split('');
  while (otpArray.length < length) {
    otpArray.push('');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.replace(/[^0-9]/g, '');
    if (!char) return; // Prevent non-digits
    
    // Take just the last character if they somehow paste multiple
    const digit = char.slice(-1);
    
    const newOtp = [...otpArray];
    newOtp[index] = digit;
    
    const newString = newOtp.join('');
    onChange(newString);
    
    // Auto-focus next input
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newOtp = [...otpArray];
      if (newOtp[index]) {
        // If current box has a value, clear it
        newOtp[index] = '';
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // If current box is empty, move back and clear previous
        newOtp[index - 1] = '';
        onChange(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      // Focus the input right after the pasted content, or the last input
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center items-center my-4" onPaste={handlePaste}>
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-300 dark:border-night-700 bg-white dark:bg-night-800 text-gray-900 dark:text-gray-100 focus:border-cam focus:ring-2 focus:ring-cam/50 outline-none transition-all"
        />
      ))}
    </div>
  );
};
