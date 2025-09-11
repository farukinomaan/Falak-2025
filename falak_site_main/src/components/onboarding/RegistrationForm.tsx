"use client";

interface RegistrationFormProps {
  name: string;
  setName: (name: string) => void;
  regNo: string;
  setRegNo: (regNo: string) => void;
  mahe: boolean;
  setMahe: (b: boolean) => void;
  institute: string;
  setInstitute: (v: string) => void;
}

export function RegistrationForm({ name, setName, regNo, setRegNo, mahe, setMahe, institute, setInstitute }: RegistrationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input
          className="w-full border rounded px-3 py-2 bg-black/20 border-white/20 text-white placeholder:text-neutral-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
        />
      </div>

      <div className="flex gap-4 items-center text-sm">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="maheToggle"
            checked={mahe}
            onChange={() => setMahe(true)}
            className="accent-[#de8c89]"
          />
          <span>MAHE</span>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="maheToggle"
            checked={!mahe}
            onChange={() => setMahe(false)}
            className="accent-[#de8c89]"
          />
          <span>Non‑MAHE</span>
        </label>
      </div>

      {mahe ? (
        <div>
          <label className="block text-sm font-medium">Registration Number</label>
          <input
            className="w-full border rounded px-3 py-2 bg-black/20 border-white/20 text-white placeholder:text-neutral-400"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            pattern="[0-9]*"
            required
            placeholder="2358...."
          />
          <p className="mt-1 text-[11px] text-neutral-400">Digits only. Previously enforced length retained for MAHE clarity.</p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium">College / Institute</label>
          <input
            className="w-full border rounded px-3 py-2 bg-black/20 border-white/20 text-white placeholder:text-neutral-400"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            required
            placeholder="Your institute name"
            maxLength={80}
          />
        </div>
      )}
    </div>
  );
}
