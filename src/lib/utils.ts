import {type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  // Format: "Month Year" (e.g., "April 2023")
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    year: 'numeric'
  });
}
