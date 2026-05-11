"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-cream px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-pitch-900">Balon</h1>
          <p className="mt-1 text-sm text-pitch-700">Admin login</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoFocus />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
