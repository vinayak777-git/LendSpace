import React from 'react';

export interface JadeSkyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  /** Opacity of the gradient background overlay (0 to 1, default 1) */
  gradientOpacity?: number;
}

/**
 * Jade Sky Background
 *
 * Bloom Field style pure CSS ambient gradient background.
 * Palette: #EEF6E3 (light sage), #B7D98E (meadow green), #7FBF9A (jade mint), #CFE9F0 (soft sky)
 * From: https://21st.dev/r/serafimcloud/jade-sky
 */
export const JadeSky: React.FC<JadeSkyProps> = ({
  className = '',
  children,
  gradientOpacity = 1,
  style,
  ...props
}) => {
  return (
    <div
      aria-hidden={!children}
      className={`relative overflow-hidden w-full h-full [container-type:size] ${className}`}
      style={style}
      {...props}
    >
      <div
        className="pointer-events-none select-none absolute inset-[-0.8cqmin] blur-[0.4cqmin] transition-opacity duration-700"
        style={{
          opacity: gradientOpacity,
          backgroundColor: '#CFE9F0',
          backgroundImage:
            'radial-gradient(circle at 65.34% 44.62%, rgba(238, 246, 227, 1) 0%, rgba(238, 246, 227, 0) 34.1%), radial-gradient(circle at 28.07% 74.48%, rgba(183, 217, 142, 1) 0%, rgba(183, 217, 142, 0) 45.65%), radial-gradient(circle at 52.42% 19.94%, rgba(127, 191, 154, 1) 0%, rgba(127, 191, 154, 0) 57.55%), radial-gradient(circle at 80.31% 84.47%, rgba(207, 233, 240, 1) 0%, rgba(207, 233, 240, 0) 69.1%)',
        }}
      />
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
};

export const GradientBackground = JadeSky;
export default JadeSky;

