import Signin from "@/components/auth/Signin";

// Use revalidate to allow caching but ensure periodic updates
export const revalidate = 3600;

const SigninPage = () => {
  return <Signin />;
};

export default SigninPage;
