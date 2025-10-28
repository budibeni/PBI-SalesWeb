// app/providers/UserProvider.jsx
"use client"

import { createContext, useContext } from "react"

const UserContext = createContext(null)

export function UserProvider({ user, children }) {
    // user bisa null → artinya belum login
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
    return useContext(UserContext)
}
