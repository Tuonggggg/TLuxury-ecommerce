// File: src/context/AuthContext.js
import { createContext, useContext } from "react";

export const AuthContext = createContext();

// ✅ Export custom hook để dễ dàng sử dụng context
export const useAuth = () => useContext(AuthContext);