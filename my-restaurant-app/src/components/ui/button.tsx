import * as React from "react"
import { RippleButton, RippleButtonRipples, type RippleButtonProps } from "@/components/animate-ui/components/buttons/ripple"
import { buttonVariants } from "@/components/animate-ui/components/buttons/button"

type ButtonProps = RippleButtonProps & {
  children?: React.ReactNode
}

function Button({
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <RippleButton asChild {...props}>
        {React.cloneElement(children as React.ReactElement<any>, {
          children: (
            <>
              {(children.props as any).children}
              <RippleButtonRipples />
            </>
          ),
        })}
      </RippleButton>
    )
  }

  return (
    <RippleButton asChild={false} {...props}>
      {children}
      <RippleButtonRipples />
    </RippleButton>
  )
}

export { Button, buttonVariants }
