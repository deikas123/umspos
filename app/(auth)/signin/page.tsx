import Signin from "@/components/auth/Signin";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = "force-dynamic";

const SigninPage = () => {
  return <Signin />;
};

export default SigninPage;
