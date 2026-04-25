import { useState } from 'react';

export function useCrewForm() {
  const [name, setName] = useState('');
  const [ssn, setSsn] = useState('');
  const [phone, setPhone] = useState('010-');
  const [address, setAddress] = useState('');
  const [idImage, setIdImage] = useState(null);
  const [licenseImage, setLicenseImage] = useState(null);

  const reset = () => {
    setName('');
    setSsn('');
    setPhone('010-');
    setAddress('');
    setIdImage(null);
    setLicenseImage(null);
  };

  const loadPerson = person => {
    setName(person.name || '');
    setSsn(person.ssn || '');
    setPhone(person.phone || '');
    setAddress(person.address || '');
    setIdImage(person.idImage ?? null);
    setLicenseImage(person.licenseImage ?? null);
  };

  return {
    name, setName,
    ssn, setSsn,
    phone, setPhone,
    address, setAddress,
    idImage, setIdImage,
    licenseImage, setLicenseImage,
    reset,
    loadPerson,
  };
}
