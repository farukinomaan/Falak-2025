"use client";

interface RegistrationFormProps {
  name: string;
  setName: (name: string) => void;
  regNo: string;
  setRegNo: (regNo: string) => void;
  setMahe: (b: boolean) => void;
  institute: string;
  setInstitute: (v: string) => void;
  mode?: 'mahe' | 'non-mahe' | 'faculty';
  setMode?: (m: 'mahe' | 'non-mahe' | 'faculty') => void;
}

export function RegistrationForm({ name, setName, regNo, setRegNo, setMahe, institute, setInstitute, mode = 'mahe', setMode }: RegistrationFormProps) {
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

      {/* Tab-like toggle */}
      <div className="relative">
        <div className="flex rounded-lg overflow-hidden border border-white/15 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <button
            type="button"
            onClick={() => { setMahe(true); setMode?.('mahe'); }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 relative group ${mode === 'mahe' ? 'bg-[#de8c89] text-[#32212C]' : 'text-neutral-300 hover:text-white'}`}
          >
            <span className="relative z-10">MAHE BLR</span>
          </button>
          <button
            type="button"
            onClick={() => { setMahe(false); setMode?.('non-mahe'); }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 relative group ${mode === 'non-mahe' ? 'bg-[#de8c89] text-[#32212C]' : 'text-neutral-300 hover:text-white'}`}
          >
            <span className="relative z-10">Non‑MAHE BLR</span>
          </button>
          <button
            type="button"
            onClick={() => { setMahe(true); setMode?.('faculty'); }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 relative group ${mode === 'faculty' ? 'bg-[#de8c89] text-[#32212C]' : 'text-neutral-300 hover:text-white'}`}
          >
            <span className="relative z-10">Faculty MAHE BLR</span>
          </button>
        </div>
      </div>

      {mode === 'mahe' ? (
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
          <p className="mt-1 text-[11px] text-neutral-400">Digits only.</p>
        </div>
      ) : mode === 'non-mahe' ? (
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
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-amber-300">Please ensure you are a faculty with a valid Employee ID before proceeding.</p>
          {/* The faculty-specific fields live in the parent page UI as per new flow */}
        </div>
      )}
    </div>
  );
}
