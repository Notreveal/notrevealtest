
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { EditalData, StudyPlan, UserProfile, User } from '../types.ts';
import { api } from '../services/apiService.ts';

// --- TYPES ---
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  activeStudyPlan: StudyPlan | null;
  studyPlans: StudyPlan[];
  activePlanId: string | null;
  saveActiveStudyPlan: (plan: StudyPlan) => Promise<void>;
  clearActiveStudyPlan: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  processNewEditalData: (data: EditalData) => Promise<boolean>;
  setActivePlanId: (planId: string) => Promise<void>;
  deleteStudyPlan: (planId: string) => Promise<void>;
}

// --- CONTEXT ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestPlan, setGuestPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load initial data from the "API" (backend or localStorage)
  useEffect(() => {
    const loadInitialData = async () => {
      const savedProfile = await api.getProfile();
      if (savedProfile) {
        setUserProfile(savedProfile);
      } else {
        const savedGuestPlan = await api.getGuestProfile();
        setGuestPlan(savedGuestPlan);
      }
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const login = async (email: string, password?: string) => {
    await api.login(email, password); // Step 1: Login and set the token
    const profile = await api.getProfile(); // Step 2: Fetch the full profile with the new token
    if (profile) {
      setUserProfile(profile);
      setGuestPlan(null); // Clear guest data on successful login
    } else {
      throw new Error("Login bem-sucedido, mas não foi possível carregar o perfil.");
    }
  };

  const register = async (email: string, password?: string) => {
    await api.register(email, password); // Step 1: Register and set the token
    const profile = await api.getProfile(); // Step 2: Fetch the new empty profile
    if (profile) {
      setUserProfile(profile);
      setGuestPlan(null);
    } else {
      throw new Error("Registro bem-sucedido, mas não foi possível carregar o perfil.");
    }
  };


  const logout = async () => {
    await api.clearUserSession();
    setUserProfile(null);
    const savedGuestPlan = await api.getGuestProfile();
    setGuestPlan(savedGuestPlan);
  };

  const continueAsGuest = async () => {
    setUserProfile(null); // Ensure user profile is cleared
    const existingGuestPlan = await api.getGuestProfile();
    setGuestPlan(existingGuestPlan);
  };

  const processNewEditalData = async (editalData: EditalData): Promise<boolean> => {
    const newPlanId = `plan_${Date.now()}`;
    const newPlan: StudyPlan = {
      id: newPlanId,
      name: editalData.titulo_concurso || `Plano de ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      editalData,
      checkedTopics: {}, mockScores: {}, subTopics: {}, disciplineLinks: {}, topicLinks: {}
    };

    if (userProfile) {
      const updatedPlans = { ...userProfile.plans, [newPlan.id]: newPlan };
      const newProfile = { ...userProfile, plans: updatedPlans, activePlanId: newPlan.id };
      await api.saveUserProfile(newProfile);
      setUserProfile(newProfile);
    } else {
      await api.saveGuestProfile(newPlan);
      setGuestPlan(newPlan);
    }
    return true;
  };

  const saveActiveStudyPlan = async (plan: StudyPlan) => {
    if (userProfile?.activePlanId) {
        const newProfile = {
            ...userProfile,
            plans: { ...userProfile.plans, [userProfile.activePlanId]: plan }
        };
        setUserProfile(newProfile); // Optimistic UI update
        await api.saveUserProfile(newProfile);
    } else if (!userProfile) {
        setGuestPlan(plan); // Optimistic UI update
        await api.saveGuestProfile(plan);
    }
  };

  const clearActiveStudyPlan = async () => {
    let clearedPlan: StudyPlan | null = null;
    if (userProfile?.activePlanId && userProfile.plans[userProfile.activePlanId]) {
      const activePlan = userProfile.plans[userProfile.activePlanId];
      clearedPlan = {
        ...activePlan,
        checkedTopics: {}, mockScores: {}, subTopics: {}, disciplineLinks: {}, topicLinks: {}
      };
    } else if (guestPlan) {
      clearedPlan = {
        ...guestPlan,
        checkedTopics: {}, mockScores: {}, subTopics: {}, disciplineLinks: {}, topicLinks: {}
      };
    }
    if (clearedPlan) {
        await saveActiveStudyPlan(clearedPlan);
    }
  };
  
  const setActivePlanId = async (planId: string) => {
      if (userProfile) {
          const newProfile = { ...userProfile, activePlanId: planId };
          setUserProfile(newProfile); // Optimistic UI update
          await api.saveUserProfile(newProfile);
      }
  };

  const deleteStudyPlan = async (planId: string) => {
      if (userProfile && userProfile.plans[planId]) {
          if (!window.confirm(`Tem certeza que deseja excluir o plano "${userProfile.plans[planId].name}"?`)) return;
          
          const updatedPlans = { ...userProfile.plans };
          delete updatedPlans[planId];
          const remainingPlanIds = Object.keys(updatedPlans);
          const newActivePlanId = planId === userProfile.activePlanId ? (remainingPlanIds[0] || null) : userProfile.activePlanId;
          
          const newProfile = { ...userProfile, plans: updatedPlans, activePlanId: newActivePlanId };
          setUserProfile(newProfile); // Optimistic UI update
          await api.saveUserProfile(newProfile);
      }
  };

  // --- DERIVED STATE ---
  const user = userProfile?.user || null;
  const isLoggedIn = !!user;
  const activeStudyPlan = userProfile ? (userProfile.plans[userProfile.activePlanId!] || null) : guestPlan;
  const studyPlans = userProfile ? Object.values(userProfile.plans) : (guestPlan ? [guestPlan] : []);
  const activePlanId = userProfile ? userProfile.activePlanId : (guestPlan ? guestPlan.id : null);

  const value: AuthContextType = {
    user,
    isLoggedIn,
    activeStudyPlan,
    studyPlans,
    activePlanId,
    saveActiveStudyPlan,
    clearActiveStudyPlan,
    login,
    register,
    logout,
    continueAsGuest,
    processNewEditalData,
    setActivePlanId,
    deleteStudyPlan,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// --- HOOK ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};