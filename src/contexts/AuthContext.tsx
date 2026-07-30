import { updateDoc } from "@/firebase/firestoreLogger";
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "@/firebase/collections";
import {
  DEFAULT_ROLE,
  DEFAULT_USER_STATUS,
  getPermissionsForRole,
  normalizeRole,
  normalizeStatus,
  Permission,
  UserRole,
  UserStatus,
} from "@/rbac/permissions";

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  status: UserStatus | null;
  permissions: Permission[];
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  userProfile: null,
  role: null,
  status: null,
  permissions: [],
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setCurrentUser(user);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      
      if (user) {
        const userRef = doc(db, "users", user.uid);
        profileUnsubscribe = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            const resolvedRole = normalizeRole(profileData.role);
            const resolvedStatus = normalizeStatus(profileData.status);
            const profile = {
              ...profileData,
              role: resolvedRole,
              status: resolvedStatus,
            } as UserProfile;
            
            const roleNeedsBackfill = profileData.role !== resolvedRole;
            const statusNeedsBackfill = profileData.status !== resolvedStatus;

            if (roleNeedsBackfill || statusNeedsBackfill) {
              await updateDoc(userRef, {
                ...(roleNeedsBackfill ? { role: DEFAULT_ROLE } : {}),
                ...(statusNeedsBackfill ? { status: DEFAULT_USER_STATUS } : {}),
              });
            }

            setUserProfile(profile);
            setRole(resolvedRole);
            setStatus(resolvedStatus);
          } else {
            setUserProfile(null);
            setRole(DEFAULT_ROLE);
            setStatus(DEFAULT_USER_STATUS);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setRole(null);
          setStatus(null);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setRole(null);
        setStatus(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear localStorage (chat history, selected member, etc.)
      localStorage.removeItem("aayu_chat_conversations");
      localStorage.removeItem("aayu_selected_family_member");
      localStorage.removeItem("aayu_demo_session");
      // Force reload to completely wipe React context and in-memory caches
      window.location.href = "/login";
    } catch (e: any) {
      console.error("Logout failed:", e);
    }
  };

  const value = useMemo(() => ({
    user: currentUser,
    currentUser,
    userProfile,
    role,
    status,
    permissions: role ? getPermissionsForRole(role) : [],
    loading,
    logout,
  }), [currentUser, userProfile, role, status, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

