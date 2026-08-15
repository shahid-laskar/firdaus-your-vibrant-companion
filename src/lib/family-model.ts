import { useEffect } from "react";
import { useStore } from "./store";

export type FamilyRole = "parent" | "child" | "other";

export interface Chore {
  id: string;
  title: string;
  done: boolean;
  recur?: any;
  completions?: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  age?: string;
  color?: string;
  avatar?: string;
  chores: Chore[]; // kept for backward compatibility with current routine workflows
}

/**
 * Migration hook. If a user has kids data but no family data,
 * we safely migrate them into the family model.
 * Original data is not deleted, ensuring safe rollback.
 */
export function useFamilyMigration() {
  const [kids] = useStore<any[]>("kids", []);
  const [family, setFamily] = useStore<FamilyMember[]>("family", []);

  useEffect(() => {
    if (kids.length > 0 && family.length === 0) {
      const migrated: FamilyMember[] = kids.map((k) => ({
        id: k.id,
        name: k.name,
        role: "child",
        age: k.age || "",
        chores: k.chores || [],
      }));
      setFamily(migrated);
    }
  }, [kids, family.length, setFamily]);
}
