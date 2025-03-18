"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef(function AlertDialogOverlay(
  props: React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Overlay>,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <AlertDialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      {...props}
      ref={ref}
    />
  );
});
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef(function AlertDialogContent(
  props: React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Content> & {
    className?: string;
  },
  ref: React.Ref<HTMLDivElement>
) {
  const { className, ...restProps } = props;
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full ${className}`}
        {...restProps}
      />
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-2 text-left ${className}`}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef(function AlertDialogTitle(
  props: React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Title> & {
    className?: string;
  },
  ref: React.Ref<HTMLHeadingElement>
) {
  const { className, ...restProps } = props;
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={`text-lg font-semibold ${className}`}
      {...restProps}
    />
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef(function AlertDialogDescription(
  props: React.ComponentPropsWithRef<
    typeof AlertDialogPrimitive.Description
  > & {
    className?: string;
  },
  ref: React.Ref<HTMLParagraphElement>
) {
  const { className, ...restProps } = props;
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={`text-sm text-muted-foreground ${className}`}
      {...restProps}
    />
  );
});
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef(function AlertDialogAction(
  props: React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Action> & {
    className?: string;
  },
  ref: React.Ref<HTMLButtonElement>
) {
  const { className, ...restProps } = props;
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...restProps}
    />
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef(function AlertDialogCancel(
  props: React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Cancel> & {
    className?: string;
  },
  ref: React.Ref<HTMLButtonElement>
) {
  const { className, ...restProps } = props;
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0 ${className}`}
      {...restProps}
    />
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
