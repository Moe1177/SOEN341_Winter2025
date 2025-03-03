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
      className={`flexCenter gap-3 rounded-full border ${variant} ${full ? "w-full" : ""}`}
      type={type}
      onClick={onClick} 
    >
      {icon && <Image src={icon} alt={title} width={24} height={24} />}
      <label className="bold-16 whitespace-nowrap cursor-pointer">{title}</label>
    </button>
  );

  return href ? (
    <Link href={href}>
      {buttonContent}
    </Link>
  ) : (
    buttonContent
  );
};

export default Button;
