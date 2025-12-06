'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  ({ open, onOpenChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open ?? false);

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    return (
      <PopoverContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
        <div ref={ref} className="relative" {...props}>
          {children}
        </div>
      </PopoverContext.Provider>
    );
  }
);
Popover.displayName = 'Popover';

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, children, asChild, onClick, ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(PopoverContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsOpen(!isOpen);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        className: cn('outline-none', className, (children as any).props.className),
        onClick: handleClick,
        ...props,
      });
    }
    return (
      <button
        ref={ref}
        type="button"
        className={cn('outline-none', className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  align?: 'start' | 'center' | 'end';
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, onClose, children, align = 'start', ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(PopoverContext);

    if (!isOpen) return null;

    const handleClose = () => {
      setIsOpen(false);
      onClose?.();
    };

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
        <div
          ref={ref}
          className={cn(
            'absolute z-50 mt-2 rounded-lg border-2 border-[#E6E6E6] bg-[#2A2B30] p-3 shadow-lg',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'end' && 'right-0',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };

