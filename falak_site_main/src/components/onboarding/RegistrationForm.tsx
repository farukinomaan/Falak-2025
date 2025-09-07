"use client";

interface RegistrationFormProps {
  name: string;
  setName: (name: string) => void;
  regNo: string;
  setRegNo: (regNo: string) => void;
  mahe: boolean;
  setMahe: (val: boolean) => void;
  institute: string;
  setInstitute: (val: string) => void;
}

export function RegistrationForm({
  name,
  setName,
  regNo,
  setRegNo,
  mahe,
  setMahe,
  institute,
  setInstitute,
}: RegistrationFormProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Are you from MAHE?</label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mahe" checked={mahe === true} onChange={() => setMahe(true)} />
            <span>MAHE</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mahe" checked={mahe === false} onChange={() => setMahe(false)} />
            <span>Non-MAHE</span>
          </label>
        </div>
      </div>

      {mahe ? (
        <div>
          <label className="block text-sm font-medium">Registration number</label>
          <input
            className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            pattern="[0-9]*"
            required
            placeholder="2358....."
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium">College name</label>
          <input
            className="w-full border-2 rounded px-3 py-2 border-[#D3877A] focus:border-[#DBAAA6]"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            required
            placeholder="Your college"
          />
        </div>
      )}
    </>
  );
}
