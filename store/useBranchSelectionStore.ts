import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BranchSelectionState = {
  selectedBranchByTenant: Record<string, string>
  setSelectedBranch: (tenantSlug: string, branchId: string) => void
  clearSelectedBranch: (tenantSlug: string) => void
  getSelectedBranch: (tenantSlug: string) => string | undefined
}

export const useBranchSelectionStore = create<BranchSelectionState>()(
  persist(
    (set, get) => ({
      selectedBranchByTenant: {},
      setSelectedBranch: (tenantSlug, branchId) =>
        set((state) => ({
          selectedBranchByTenant: {
            ...state.selectedBranchByTenant,
            [tenantSlug]: branchId,
          },
        })),
      clearSelectedBranch: (tenantSlug) =>
        set((state) => {
          const next = { ...state.selectedBranchByTenant }
          delete next[tenantSlug]
          return { selectedBranchByTenant: next }
        }),
      getSelectedBranch: (tenantSlug) => get().selectedBranchByTenant[tenantSlug],
    }),
    {
      name: 'selected-branch-storage',
    },
  ),
)
