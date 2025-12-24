import { AuthLayout } from "@/components/auth/layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthToggle } from "@/components/auth/toggle";
import PageTitle from "@/components/page-title";
import { getConfig } from "@/fetchers/config/get-config";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUp,
  beforeLoad: async () => {
    const config = await getConfig();

    if (config.disableRegistration) {
      redirect({ to: "/auth/sign-in", replace: true });
    }
  },
});

function SignUp() {
  return (
    <>
      <PageTitle title="Crear Cuenta" />
      <AuthLayout
        title="Crear cuenta"
        subtitle="Comienza a usar tu espacio de trabajo"
      >
        <div className="space-y-4 mt-6">
          <SignUpForm />
          <AuthToggle
            message="¿Ya tienes una cuenta?"
            linkText="Iniciar sesión"
            linkTo="/auth/sign-in"
          />
        </div>
      </AuthLayout>
    </>
  );
}
