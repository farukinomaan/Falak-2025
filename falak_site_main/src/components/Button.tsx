import clsx from "clsx";

// Define the interface for the props
interface ButtonProps {
  id: string;
  title: string;
  rightIcon?: React.ReactNode;  // Type for React elements, `rightIcon` is optional
  leftIcon?: React.ReactNode;   // Type for React elements, `leftIcon` is optional
  containerClass?: string;      // Optional additional class for container styling
}

const Button: React.FC<ButtonProps> = ({ id, title, rightIcon, leftIcon, containerClass = "" }) => {
  return (
    <button
      id={id}
      className={clsx(
        "group relative z-10 w-fit cursor-pointer overflow-hidden",
        containerClass
      )}
    >
      {leftIcon}

      <span className="relative inline-flex overflow-hidden font-general text-xs uppercase font-bold">
        <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:translate-y-[-160%] group-hover:skew-y-10">
          {title}
        </div>
        <div className="absolute translate-y-[164%] skew-y-10 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0">
          {title}
        </div>
      </span>

      {rightIcon}
    </button>
  );
};


export default Button;
