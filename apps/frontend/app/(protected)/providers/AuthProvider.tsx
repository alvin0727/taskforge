"use client";
import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import userService from "@/services/users/userService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (user) {
        return;
      }
      try {
        const profile = await userService.getProfile();
        if (profile && isMounted) {
          setUser(profile);
        } else if (isMounted) {
          router.replace("/user/login");
          toast.error("You must be logged in to access this page.");
        }
      } catch {
        if (isMounted) {
          router.replace("/user/login");
          toast.error("You must be logged in to access this page.");
        }
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, [setUser, router, user]);

  return <>{children}</>;
}