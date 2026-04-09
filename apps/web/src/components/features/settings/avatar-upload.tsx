"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { userService } from "@web/services/user.service";
import { Button } from "@web/components/ui/button";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userName: string;
  token: string;
  onUpdate: (url: string | null) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, token, onUpdate }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const dicebearUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;
  const avatarSrc = currentAvatarUrl ?? dicebearUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    setStatus("uploading");

    try {
      const presignRes = (await userService.presignAvatar(
        { content_type: file.type, file_size_bytes: file.size },
        token,
      )) as { data: { upload_url: string; final_url: string } };

      const { upload_url, final_url } = presignRes.data;

      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) throw new Error("Falha ao enviar a imagem para o servidor.");

      await userService.updateAvatar(final_url, token);
      onUpdate(final_url);
      setStatus("idle");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Algo deu errado");
      setStatus("idle");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setError(null);
    setStatus("uploading");
    try {
      await userService.deleteAvatar(token);
      onUpdate(null);
      setStatus("idle");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Algo deu errado");
      setStatus("idle");
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border">
        <Image
          src={avatarSrc}
          alt={`Avatar de ${userName}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={status === "uploading"}
            onClick={() => inputRef.current?.click()}
          >
            {status === "uploading" ? "Enviando..." : "Trocar foto"}
          </Button>

          {currentAvatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={status === "uploading"}
              onClick={handleDelete}
            >
              Remover
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP. Máximo 2MB.</p>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
