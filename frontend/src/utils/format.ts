function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}) {
  const parts = [address.line1];
  if (address.line2) parts.push(address.line2);
  parts.push(`${address.city}, ${address.state} ${address.postal_code}`);
  parts.push(address.country);
  return parts.join(", ");
}

export { formatAddress };
