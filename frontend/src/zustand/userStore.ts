import { create } from "zustand";

type User = {
  id: string;
  role: string;
};

type State = {
  userState: User;
};

type Actions = {
  setUserState: (userData: User) => void;
};

const initialState: User = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user")!)
  : {
      id: "",
      role: "user",
    };

const useUserStore = create<State & Actions>((set) => ({
    userState: { ...initialState },

    setUserState: (userData) => set({ userState: userData }),
}));

export default useUserStore;
