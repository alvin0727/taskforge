"use client";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import userService from "@/services/users/userService";
import Loading from "@/components/layout/loading";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      setLoading(false);
      return;
    }
    userService.getProfile().then((profile) => {
      if (profile && isMounted) {
        setUser(profile);
        setLoading(false);
      } else if (isMounted) {
        router.replace("/user/login");
        toast.error("You must be logged in to access this page.");
      }
    }).catch(() => {
      if (isMounted) {
        router.replace("/user/login");
        toast.error("You must be logged in to access this page.");
      }
    });
    return () => { isMounted = false; };
  }, [setUser, router, user]);

  if (loading && !user) return <Loading />;
  return <>{children}</>;
}