import SigninClient from "./SigninClient";

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = "force-dynamic";

const SigninPage = () => {
  return <SigninClient />;
};

export default SigninPage;
