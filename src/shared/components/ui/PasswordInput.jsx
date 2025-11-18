import { useState, forwardRef } from 'react';
import { Input } from './Input';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { cn } from '@shared/utils/cn';

export const PasswordInput = forwardRef(({ className = '', ...props }, ref) => {
  const [show, setShow] = useState(false);
  const toggle = () => setShow(s => !s);

  const EyeButton = ({ className: iconClass }) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      className={cn(iconClass, 'text-gray-500 hover:text-gray-700 focus:outline-none')}
    >
      {show ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
    </button>
  );

  return (
    <Input
      ref={ref}
      {...props}
      type={show ? 'text' : 'password'}
      rightIcon={EyeButton}
      className={cn(className)}
    />
  );
});

export default PasswordInput;
