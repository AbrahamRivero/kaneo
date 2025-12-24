import PageTitle from "@/components/page-title";
import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "../../components/auth/layout";
import { SignInForm } from "../../components/auth/sign-in-form";
import { AuthToggle } from "../../components/auth/toggle";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignIn,
});

function SignIn() {
  return (
    <>
      <PageTitle title="Acceder" />
      <AuthLayout
        title="Bienvenido de nuevo"
        subtitle="Introduce tus credenciales para acceder a tu espacio"
      >
        <div className="space-y-4 mt-6">
          <SignInForm />
          <AuthToggle
            message="¿No tienes una cuenta?"
            linkText="Crear cuenta"
            linkTo="/auth/sign-up"
          />
        </div>
      </AuthLayout>
    </>
  );
}
