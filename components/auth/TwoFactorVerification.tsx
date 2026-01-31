"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Loader2, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
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
    <div className='flex flex-col items-center justify-center min-h-screen bg-background px-4 py-6'>
      {/* Logo above the card */}
      <Image
        src='/logo.png'
        alt='UMS POS'
        width={80}
        height={80}
        className='object-contain mb-4'
        priority
      />

      <Card className='w-full max-w-sm border shadow-lg'>
        <CardHeader className='pb-3 pt-5 px-5 text-center'>
          <CardTitle className='text-xl font-bold flex items-center justify-center gap-2'>
            <ShieldCheck className='h-5 w-5 text-primary' />
            Verify Your Identity
          </CardTitle>
          <p className='text-sm text-muted-foreground mt-1'>
            Enter the 6-digit code
          </p>
        </CardHeader>

        <CardContent className='space-y-4 px-5 pb-4'>
          {/* OTP Input */}
          <div className='flex flex-col items-center space-y-3'>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              disabled={isVerifying}
              className='gap-1.5'>
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
                <InputOTPSlot
                  index={1}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
                <InputOTPSlot
                  index={2}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot
                  index={3}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
                <InputOTPSlot
                  index={4}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
                <InputOTPSlot
                  index={5}
                  className='h-11 w-10 text-lg font-semibold border-2 rounded-md'
                />
              </InputOTPGroup>
            </InputOTP>

            {/* Error Message */}
            {error && (
              <p className='text-sm text-red-600 text-center font-medium'>
                {error}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <Button
            className='w-full h-10 font-semibold bg-primary hover:bg-primary/90 cursor-pointer'
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className='mr-2 h-4 w-4' />
                Verify Code
              </>
            )}
          </Button>

          {/* Resend Section */}
          <div className='flex items-center justify-center gap-2'>
            <span className='text-xs text-muted-foreground'>
              Didn&apos;t receive it?
            </span>
            <Button
              variant='link'
              size='sm'
              className='h-auto p-0 text-xs font-medium cursor-pointer'
              onClick={handleSendOtp}
              disabled={countdown > 0 || isSendingOtp}>
              {isSendingOtp && (
                <>
                  <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                  Sending...
                </>
              )}
              {!isSendingOtp && countdown > 0 && (
                <>
                  <RefreshCw className='mr-1 h-3 w-3' />
                  Resend in {countdown}s
                </>
              )}
              {!isSendingOtp && countdown <= 0 && (
                <>
                  <RefreshCw className='mr-1 h-3 w-3' />
                  Resend
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className='pt-0 pb-4 px-5 flex-col gap-2'>
          <Button
            variant='ghost'
            size='sm'
            className='w-full text-muted-foreground hover:text-foreground cursor-pointer h-8'
            onClick={handleBackToSignIn}>
            <ArrowLeft className='mr-1.5 h-3.5 w-3.5' />
            Back to Sign In
          </Button>
          <p className='text-[10px] text-muted-foreground text-center'>
            Code expires in 5 minutes. Never share it with anyone.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
