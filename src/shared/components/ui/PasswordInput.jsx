import { useState, forwardRef } from 'react';
import { Input } from './Input';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { cn } from '@shared/utils/cn';

export const PasswordInput = forwardRef(({ className = '', ...props }, ref) => {
  const [show, setShow] = useState(false);
  const toggle = () => setShow(s => !s);

  // RightIcon expects a component that accepts className
  const EyeButton = ({ className: iconClass = '' }) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      title={show ? 'Ocultar senha' : 'Mostrar senha'}
      className={cn(iconClass, 'inline-flex items-center justify-center p-1 rounded focus:ring-2 focus:ring-offset-1 focus:ring-primary')}
    >
      {show ? <HiOutlineEyeOff className="w-5 h-5 text-gray-600" /> : <HiOutlineEye className="w-5 h-5 text-gray-600" />}
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
