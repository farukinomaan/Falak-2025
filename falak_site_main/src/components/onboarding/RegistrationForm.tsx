"use client";

interface RegistrationFormProps {
  name: string;
  setName: (name: string) => void;
  regNo: string;
  setRegNo: (regNo: string) => void;
}

export function RegistrationForm({ name, setName, regNo, setRegNo }: RegistrationFormProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Registration number</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          required
          placeholder="e.g. MAHE123..."
        />
      </div>
    </>
  );
}
