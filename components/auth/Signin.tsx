"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, getSession, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useRouter } from "next/navigation";

const EMAIL_DOMAINS = [
  { value: "umskenya.com", label: "@umskenya.com" },
  { value: "gmail.com", label: "@gmail.com" },
] as const;

const SignIn = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [emailPrefix, setEmailPrefix] = useState("");
  const [emailDomain, setEmailDomain] = useState("umskenya.com");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/deactivated");
    router.prefetch("/two-factor");
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const email = `${emailPrefix}@${emailDomain}`;

    await signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: async (ctx) => {
          try {
            // If 2FA is required, better-auth will call onTwoFactorRedirect
            // and redirect to /two-factor automatically. Do NOT redirect here
            // in that case — wait for the twoFactorClient plugin to handle it.
            // Only redirect to dashboard if we have a full session (no 2FA pending).
            const session = await getSession();
            const user = session?.data?.user as any;

            // If no session yet, 2FA redirect is in progress — do nothing
            if (!session?.data?.session) {
              return;
            }

            const isActive = user?.isActive ?? true;
            if (!isActive) {
              await signOut();
              setIsLoading(false);
              globalThis.location.href = "/deactivated";
              return;
            }

            globalThis.location.href = "/dashboard";
          } catch (sessionError) {
            setError("Failed to fetch session. Please try again.");
            setIsLoading(false);
          }
        },
        onError: (ctx) => {
          const rawMessage: string | undefined = ctx.error?.message;

          const errorMessage = rawMessage?.trim().length
            ? rawMessage
            : "Failed to sign in";

          setError(errorMessage);

          if (rawMessage?.includes("Invalid login credentials")) {
            setPassword("");
          }
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className='flex flex-col items-center justify-center space-y-4 min-h-screen bg-background'>
      <Image
        src='/logo.png'
        alt='logo'
        width={120}
        height={120}
        className='w-30 h-30 object-contain'
        priority
      />
      <h1 className='uppercase text-4xl font-bold'>POS System</h1>
      <Card className='w-[350px]'>
        <CardHeader>
          <CardTitle className='text-center uppercase'>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-xl'>
                  Email
                </Label>
                <div className='flex rounded-lg shadow-sm shadow-black/[.04]'>
                  <Input
                    id='email'
                    className='-me-px rounded-e-none shadow-none'
                    placeholder='johndoe'
                    type='text'
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Select
                    value={emailDomain}
                    onValueChange={setEmailDomain}
                    disabled={isLoading}>
                    <SelectTrigger className='w-[160px] rounded-s-none border-s-0'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_DOMAINS.map((domain) => (
                        <SelectItem key={domain.value} value={domain.value}>
                          {domain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-xl'>
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    className='pe-9'
                    placeholder='Password'
                    type={isVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    className='absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground cursor-pointer focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                    type='button'
                    onClick={toggleVisibility}
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    aria-pressed={isVisible}
                    aria-controls='password'
                    disabled={isLoading}>
                    {isVisible ? (
                      <EyeOff size={16} strokeWidth={2} aria-hidden='true' />
                    ) : (
                      <Eye size={16} strokeWidth={2} aria-hidden='true' />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
            <Button
              type='submit'
              className='w-full mt-4 cursor-pointer bg-primary hover:bg-[#000061]'
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='text-sm text-center w-full'>
            Don't have an account? Contact an admin.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
