import clsx from "clsx";

interface ButtonProps {
  id?: string;
  title: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerClass?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  id,
  title,
  rightIcon,
  leftIcon,
  containerClass = "",
  onClick,
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={clsx(
        // Make the whole button area interactive
        "relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-wide cursor-pointer select-none transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95",
        containerClass
      )}
    >
      {leftIcon && <span>{leftIcon}</span>}
      <span>{title}</span>
      {rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

export default Button;
