import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/tms/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Trantech Report"
        description="Trantech Report"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
