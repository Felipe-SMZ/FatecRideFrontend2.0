import { PageContainer } from "@shared/components/layout/PageContainer";
import { Card } from "@shared/components/ui/Card";
import { Button } from "@shared/components/ui/Button";
import { Input } from "@shared/components/ui/Input";
import { useAuthStore } from "@features/auth/stores/authStore";
import { useState } from "react";

/**
 * ProfilePage - Página de perfil do usuário
 * Permite visualizar e editar informações pessoais
 */

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <PageContainer
      title="Meu Perfil"
      description="Visualize e edite suas informações pessoais"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <Input value={user?.nome || ""} disabled={!isEditing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input value={user?.email || ""} disabled={!isEditing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Usuário
                  </label>
                  <Input
                    value={user?.role === "MOTORISTA" ? "Motorista" : "Passageiro"}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(false)}>
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;
