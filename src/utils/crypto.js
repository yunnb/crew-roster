export async function hashPIN(pin) {
  const enc = new TextEncoder().encode(pin + 'crew-salt-2024');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
