import { useState, useRef } from "react";
import { sendOTP, verifyOTP } from "../../services/authService";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function PhoneAuth({ onSuccess }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("phone"); // phone | otp
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const inputsRef = useRef([]);

  const handleSendOTP = async () => {
    if (phone.length < 10) return toast.error("Enter a valid phone number");
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const result = await sendOTP(fullPhone);
      setConfirmationResult(result);
      setStep("otp");
      toast.success("OTP sent!");
    } catch (e) {
      toast.error(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await verifyOTP(confirmationResult, code);
      toast.success("Phone verified!");
      onSuccess?.();
    } catch (e) {
      toast.error("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {step === "phone" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div id="recaptcha-container" />
          <Button onClick={handleSendOTP} loading={loading} className="w-full">
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 text-center">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold">+91 {phone}</span>
          </p>
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
                className="w-10 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
              />
            ))}
          </div>
          <Button onClick={handleVerify} loading={loading} className="w-full">
            Verify OTP
          </Button>
          <button
            onClick={() => { setStep("phone"); setOtp(["","","","","",""]); }}
            className="w-full text-sm text-orange-500 hover:underline"
          >
            Change number / Resend
          </button>
        </>
      )}
    </div>
  );
}
