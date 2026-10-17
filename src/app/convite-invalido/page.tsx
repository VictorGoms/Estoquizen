"use client";

import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { BanIcon } from "@/components/ui/icons";

export default function ConviteInvalidoPage() {
  const router = useRouter();

  return (
    <AuthLayout
      title="Convite inválido"
      icon={<BanIcon className="w-7 h-7 text-zero" />}
      subtitle="Este convite foi cancelado ou já expirou."
    >
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm font-semibold text-fg-muted leading-relaxed">
          Fale com o administrador do workspace para receber um novo convite.
        </p>
        <PrimaryButton type="button" onClick={() => router.replace("/login")}>
          Ir para o login
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
