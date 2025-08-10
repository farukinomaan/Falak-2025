// Useless component

// "use client"

// import * as React from "react"
// import { toast } from "sonner"
// import { Button } from "@/components/ui/button"
// import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

// export function InputOTPForm() {
//   const [pin, setPin] = React.useState("")

//   function onSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     if (pin.length !== 6) {
//       toast.error("Your one-time password must be 6 digits.")
//       return
//     }
//     toast("You submitted the following values", {
//       description: (
//         <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
//           <code className="text-white">{JSON.stringify({ pin }, null, 2)}</code>
//         </pre>
//       ),
//     })
//   }

//   return (
//     <form onSubmit={onSubmit} className="w-2/3 space-y-6">
//       <div className="space-y-2">
//         <label className="text-sm font-medium">One-Time Password</label>
//         <InputOTP maxLength={6} value={pin} onChange={setPin}>
//           <InputOTPGroup>
//             <InputOTPSlot index={0} />
//             <InputOTPSlot index={1} />
//             <InputOTPSlot index={2} />
//             <InputOTPSlot index={3} />
//             <InputOTPSlot index={4} />
//             <InputOTPSlot index={5} />
//           </InputOTPGroup>
//         </InputOTP>
//         <p className="text-muted-foreground text-sm">
//           Please enter the one-time password sent to your phone.
//         </p>
//       </div>
//       <Button variant="outline" type="submit">Submit</Button>
//     </form>
//   )
// }
