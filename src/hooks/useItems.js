"use client"

import { useContext } from "react"
import { ItemsContext } from "@/providers/ItemsProvider"

export default function useItems() {
    return useContext(ItemsContext)
}
