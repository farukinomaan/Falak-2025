import GuestContactForm from "./GuestContactForm";



export default function UnregisteredNotice() {
  return (
    <div className="max-h-screen 
  max-w-screen 
  bg-[#191919]/95
  border 
  backdrop-blur-sm
  rounded-2xl 
  border-black/5 
  py-10 
  px-7 
  text-neutral-50">
      <p className="text-sm sm:text-base text-center">
        You are logged in but haven&apos;t completed registration. Please finish onboarding to raise a support ticket tied to your account.
      </p>
      <div className="text-center">
        <a 
          href="/onboarding" 
          className="mb-2 mt-2 inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gray-600 text-white text-sm sm:text-base hover:bg-gray-700 transition-colors"
        >
          Complete Registration
        </a>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <GuestContactForm standalone={false} />
      </div>
    </div>
  );
}