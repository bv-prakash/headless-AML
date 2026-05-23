"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/src/utils/errors";
import {
  CREATE_COMPANY_TEAM_MUTATION,
  type CreateCompanyTeamInput,
  type CreateCompanyTeamResponse,
} from "@/src/framework/graphql/company-structure/mutations/createCompanyTeam";
import {
  UPDATE_COMPANY_TEAM_MUTATION,
  type UpdateCompanyTeamInput,
  type UpdateCompanyTeamResponse,
} from "@/src/framework/graphql/company-structure/mutations/updateCompanyTeam";
import type {
  CompanyStructureTeamEntity,
  StructureNode,
} from "@/src/framework/graphql/company-structure/types";
import { toMagentoUid } from "@/src/framework/graphql/utils/magentoIds";
import { FormModal } from "@/src/components/account/company/FormModal";
import { TextAreaField, TextField } from "@/src/components/account/company/FormFields";

type Props = {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  /** Parent structure node id for create-mode. Null = attach to company root. */
  readonly parentId: string | null;
  /** Existing team node for edit-mode. Ignored in create-mode. */
  readonly team: StructureNode | null;
  readonly onClose: () => void;
};

const REFETCH = ["CompanyStructure"];

export function CompanyTeamModal({ open, mode, parentId, team, onClose }: Props) {
  const editing = mode === "edit";
  const existing =
    editing && team?.item.entity?.__typename === "CompanyTeam"
      ? (team.item.entity as CompanyStructureTeamEntity)
      : null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [open, existing?.team_entity_id, existing?.name, existing?.description]);

  const [createTeam, { loading: creating }] = useMutation<
    CreateCompanyTeamResponse,
    { input: CreateCompanyTeamInput }
  >(CREATE_COMPANY_TEAM_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
  const [updateTeam, { loading: updating }] = useMutation<
    UpdateCompanyTeamResponse,
    { input: UpdateCompanyTeamInput }
  >(UPDATE_COMPANY_TEAM_MUTATION, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });

  const loading = creating || updating;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      if (!trimmedName) {
        toast.error("Team name is required.");
        return;
      }
      try {
        if (editing && existing) {
          await updateTeam({
            variables: {
              input: {
                id:
                  toMagentoUid(existing.team_entity_id) ??
                  existing.team_entity_id,
                name: trimmedName,
                /** Send empty string to clear the description. */
                description: trimmedDescription,
              },
            },
          });
          toast.success(`Team "${trimmedName}" updated.`);
        } else {
          await createTeam({
            variables: {
              input: {
                name: trimmedName,
                ...(trimmedDescription ? { description: trimmedDescription } : {}),
                ...(parentId ? { target_id: parentId } : {}),
              },
            },
          });
          toast.success(`Team "${trimmedName}" created.`);
        }
        onClose();
      } catch (err) {
        toast.error(
          getErrorMessage(err, editing ? "Failed to update team." : "Failed to create team."),
        );
      }
    },
    [name, description, editing, existing, parentId, createTeam, updateTeam, onClose],
  );

  return (
    <FormModal
      open={open}
      title={editing ? "Edit Team" : "Add Team"}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitDisabled={!name.trim()}
    >
      <TextField
        ref={nameInputRef}
        id="company-team-name"
        label="Team Name"
        required
        value={name}
        onChange={setName}
        maxLength={100}
      />
      <TextAreaField
        id="company-team-description"
        label="Description"
        value={description}
        onChange={setDescription}
        rows={3}
        maxLength={500}
      />
    </FormModal>
  );
}
