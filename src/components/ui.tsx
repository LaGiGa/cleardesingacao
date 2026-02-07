import React from 'react';
import { cn } from '../lib/utils';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' }>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 dark:bg-blue-700 dark:hover:bg-blue-600",
            secondary: "bg-purple-600 text-white hover:bg-purple-700 active:scale-95 dark:bg-purple-700 dark:hover:bg-purple-600",
            outline: "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 active:scale-95",
            ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 active:scale-95",
            destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95 dark:bg-red-700 dark:hover:bg-red-600"
        };
        return (
            <button
                ref={ref}
                className={cn("inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:focus:ring-offset-slate-900", variants[variant], className)}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("rounded-xl border bg-card text-card-foreground shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800", className)}
            {...props}
        />
    )
);
Card.displayName = "Card";

export const CardHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <h3 className={cn("font-semibold leading-none tracking-tight dark:text-gray-100", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-200 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:ring-offset-slate-900",
                    className
                )}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200",
                className
            )}
            {...props}
        />
    )
)
Label.displayName = "Label"
