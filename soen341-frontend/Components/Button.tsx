import Image from "next/image";
import Link from "next/link";
import React from "react";

type ButtonProps = {
  type: "button" | "submit";
  title: string;
  icon?: string;
  variant: string;
  full?: boolean;
  href?: string;
  onClick?: () => void; 
};

const Button = ({ type, title, icon, variant, full, href, onClick }: ButtonProps) => {
  const buttonContent = (
    <button
      className={`flexCenter gap-2 sm:gap-3 rounded-full border text-sm sm:text-base ${variant} px-6 py-3 sm:px-10 sm:py-4 hover:opacity-90 transition-opacity ${full ? "w-full" : ""}`}
      type={type}
      onClick={onClick} 
    >
      {icon && <Image src={icon} alt={title} width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />}
      <span className="bold-16 whitespace-nowrap cursor-pointer">{title}</span>
    </button>
  );

  return href ? (
    <Link href={href} className="block">
      {buttonContent}
    </Link>
  ) : (
    buttonContent
  );
};

export default Button;
