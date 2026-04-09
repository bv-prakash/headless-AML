"use client";

type CheckoutGuestEmailProps = {
  readonly value: string;
  readonly onChange: (v: string) => void;
};

export default function CheckoutGuestEmail({
  value,
  onChange,
}: CheckoutGuestEmailProps) {
  return (
    <div>
      <label
        htmlFor="checkout-guest-email"
        className="block text-sm font-semibold text-black mb-1"
      >
        Email <span className="text-red-600">*</span>
      </label>
      <input
        id="checkout-guest-email"
        type="email"
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-text w-full h-11 px-4 text-base border rounded border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
        placeholder="you@example.com"
      />
    </div>
  );
}
