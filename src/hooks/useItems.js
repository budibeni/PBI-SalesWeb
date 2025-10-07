"use client"

import { useContext } from "react"
import { ItemsContext } from "@/components/items/ItemsProvider"

export default function useItems() {
    return useContext(ItemsContext)
}
