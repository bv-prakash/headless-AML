import { memo } from "react";

type AddressStreetLinesProps = {
  readonly street?: readonly string[] | null;
  readonly className?: string;
};

/** Renders street array as stacked lines (shared by address book + table). */
export const AddressStreetLines = memo(function AddressStreetLines({
  street,
  className = "space-y-1",
}: AddressStreetLinesProps) {
  if (!street?.length) return null;
  return (
    <div className={className}>
      {street.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  );
});
AddressStreetLines.displayName = "AddressStreetLines";
