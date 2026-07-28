"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "@/lib/utils"

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerBackdrop({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-[60] bg-foreground/30 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerViewport({ className, ...props }: DrawerPrimitive.Viewport.Props) {
  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn("fixed inset-x-0 bottom-0 z-[60]", className)}
      {...props}
    />
  )
}

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Popup
      data-slot="drawer-content"
      className={cn(
        "mx-auto flex max-h-[85vh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-2xl bg-popover pb-[calc(env(safe-area-inset-bottom)+4.5rem)] shadow-2xl outline-none duration-150 will-change-transform transform-gpu data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-foreground/15" />
      {children}
    </DrawerPrimitive.Popup>
  )
}

export { Drawer, DrawerPortal, DrawerBackdrop, DrawerViewport, DrawerContent }
