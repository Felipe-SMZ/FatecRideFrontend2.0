/**
 * Logo Component - FatecRide
 * Exibe a logo oficial do FatecRide
 */

export const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizes[size]} ${className}`}>
      <img 
        src="/images/Logo.png"
        alt="FatecRide Logo" 
        className="w-full h-full object-contain drop-shadow-lg"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<div class="w-full h-full bg-fatecride-blue rounded-full flex items-center justify-center text-white text-3xl font-bold">F</div>';
        }}
      />
    </div>
  );
};
