"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Form = ({ children }: { children: React.ReactNode }) => <>{children}</>

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
  )
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => (
    <label ref={ref} data-slot="form-label" className={cn("text-sm font-medium", className)} {...props} />
  )
)
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="form-control" className={className} {...props} />
  )
)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} data-slot="form-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} data-slot="form-message" className={cn("text-destructive text-sm font-medium", className)} {...props} />
))
FormMessage.displayName = "FormMessage"

const FormField = ({ children }: { children: React.ReactNode }) => <>{children}</>

export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
