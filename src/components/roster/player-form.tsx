// src/components/roster/player-form.tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "./avatar-upload";
import type { Player } from "@/types/player";

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

interface Props {
  action: Action;
  player?: Player;
  submitLabel: string;
}

export function PlayerForm({ action, player, submitLabel }: Props) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  return (
    <form action={dispatch} className="max-w-md space-y-5 rounded-xl border border-pitch-100 bg-white p-6">
      <div className="space-y-2">
        <Label>Avatar</Label>
        <AvatarUpload
          name="avatarDataUrl"
          existingUrl={player?.avatarPath ? `/api/avatars/${player.avatarPath.split("/").pop()}` : null}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname *</Label>
        <Input
          id="nickname"
          name="nickname"
          required
          defaultValue={player?.nickname}
          maxLength={40}
        />
        {state?.fieldErrors?.nickname && (
          <p className="text-sm text-red-600">{state.fieldErrors.nickname}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jerseyNumber">Jersey number</Label>
        <Input
          id="jerseyNumber"
          name="jerseyNumber"
          type="number"
          min={0}
          max={999}
          defaultValue={player?.jerseyNumber ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredPosition">Preferred position</Label>
        <select
          id="preferredPosition"
          name="preferredPosition"
          defaultValue={player?.preferredPosition ?? ""}
          className="h-10 w-full rounded-md border border-pitch-100 bg-white px-3 text-sm"
        >
          <option value="">No preference</option>
          <option value="GK">Goalkeeper</option>
          <option value="DF">Defender</option>
          <option value="MF">Midfielder</option>
          <option value="FW">Forward</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
