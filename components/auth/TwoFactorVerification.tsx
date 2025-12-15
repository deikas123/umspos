"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Loader2,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function TwoFactorVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP on initial load
  useEffect(() => {
    handleSendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (countdown > 0) return;

    setIsSendingOtp(true);
    setError(null);

    try {
      await authClient.twoFactor.sendOtp();
      setCountdown(60);
      toast.success("Verification code sent to your phone");
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to send verification code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.verifyOtp({
        code: otp,
        trustDevice: true,
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code");
        setOtp("");
      } else {
        toast.success("Verification successful!");
        // Navigate to dashboard
        globalThis.location.href = "/dashboard";
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Verification failed";
      setError(errorMessage);
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push("/signin");
  };

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-background px-4 overflow-hidden'>
      {/* Logo */}
      <div className='flex flex-col items-center space-y-2 mb-6'>
        <Image
          src='/logo.png'
          alt='UMS POS Logo'
          width={72}
          height={72}
          className='object-contain'
          priority
        />
      </div>

      {/* Verification Card */}
      <Card className='w-full max-w-md border shadow-lg'>
        <CardHeader className='space-y-3 pb-2'>
          {/* Icon */}
          <div className='mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center'>
            <ShieldCheck className='h-7 w-7 text-primary' />
          </div>

          <div className='text-center space-y-1'>
            <CardTitle className='text-xl font-bold'>
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className='text-sm'>
              We sent a 6-digit code to your phone
            </CardDescription>
          </div>

          {/* Phone Indicator */}
          <div className='flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg'>
            <Smartphone className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm text-muted-foreground'>
              Check your SMS messages
            </span>
          </div>
        </CardHeader>

        <CardContent className='space-y-5 pt-2'>
          {/* OTP Input */}
          <div className='flex flex-col items-center space-y-4'>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              disabled={isVerifying}
              className='gap-2'>
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
                <InputOTPSlot
                  index={1}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
                <InputOTPSlot
                  index={2}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot
                  index={3}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
                <InputOTPSlot
                  index={4}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
                <InputOTPSlot
                  index={5}
                  className='h-14 w-12 text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary/20'
                />
              </InputOTPGroup>
            </InputOTP>

            {/* Error Message */}
            {error && (
              <div className='w-full py-2.5 px-4 bg-red-50 border border-red-100 rounded-lg'>
                <p className='text-sm text-red-600 text-center font-medium'>
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Verify Button */}
          <Button
            className='w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 cursor-pointer'
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className='mr-2 h-5 w-5' />
                Verify Code
              </>
            )}
          </Button>

          {/* Resend Section */}
          <div className='flex flex-col items-center space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Didn&apos;t receive the code?
            </p>
            <Button
              variant='outline'
              className='h-9 px-5 cursor-pointer'
              onClick={handleSendOtp}
              disabled={countdown > 0 || isSendingOtp}>
              {isSendingOtp && (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending...
                </>
              )}
              {!isSendingOtp && countdown > 0 && (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Resend in {countdown}s
                </>
              )}
              {!isSendingOtp && countdown <= 0 && (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className='pt-0 pb-4'>
          <Button
            variant='ghost'
            className='w-full text-muted-foreground hover:text-foreground cursor-pointer'
            onClick={handleBackToSignIn}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>

      {/* Security Note */}
      <p className='text-xs text-muted-foreground text-center max-w-sm mt-4'>
        For your security, this code expires in 5 minutes. Never share your
        verification code with anyone.
      </p>
    </div>
  );
}
