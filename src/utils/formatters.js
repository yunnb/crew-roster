export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const fmtPhone = v => {
  const n = v.replace(/\D/g, '');
  if (n.length <= 3) return n;
  if (n.length <= 7) return n.slice(0, 3) + '-' + n.slice(3);
  return n.slice(0, 3) + '-' + n.slice(3, 7) + '-' + n.slice(7, 11);
};

export const fmtSSN = v => {
  const n = v.replace(/\D/g, '');
  if (n.length <= 6) return n;
  return n.slice(0, 6) + '-' + n.slice(6, 13);
};

export const maskSSN = s => {
  if (!s) return '';
  const n = s.replace(/\D/g, '');
  return n.length < 7 ? s : n.slice(0, 6) + '-' + n[6] + '••••••';
};

export const fileToB64 = f => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(f);
});

export const getAgeFromSSN = ssn => {
  if (!ssn || ssn.length < 7) return 0;
  const year = parseInt(ssn.substring(0, 2), 10);
  const month = parseInt(ssn.substring(2, 4), 10);
  const day = parseInt(ssn.substring(4, 6), 10);
  const centuryDigit = parseInt(ssn.charAt(6), 10);

  let birthYear = 0;
  if (centuryDigit === 1 || centuryDigit === 2) {
    birthYear = 1900 + year;
  } else if (centuryDigit === 3 || centuryDigit === 4) {
    birthYear = 2000 + year;
  } else {
    return 0; // Invalid
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age--;
  }
  return age;
};
