import React from 'react';
import {AppIconProps} from './types';

// SVG Icon Components
export const StartIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path d="M5.586 3.414A2 2 0 017 2h10a2 2 0 012 2v10a2 2 0 01-1.414 1.914l-1 .086H16a1 1 0 00-1 1v1.5H9.5V17a1 1 0 00-1-1H7l-1-.086A2 2 0 015 14V4a2 2 0 01.586-.586zM17 19.5a1 1 0 11-2 0 1 1 0 012 0zM7 19.5a1 1 0 11-2 0 1 1 0 012 0zM12 7.5a1 1 0 11-2 0 1 1 0 012 0zM12 11.5a1 1 0 11-2 0 1 1 0 012 0zM16 7.5a1 1 0 11-2 0 1 1 0 012 0zM16 11.5a1 1 0 11-2 0 1 1 0 012 0zM8 7.5a1 1 0 11-2 0 1 1 0 012 0zM8 11.5a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

export const SearchIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

export const SettingsIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.844c.008.379.137.753.43.992l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.354-.133-.75-.072-1.075.124a6.607 6.607 0 0 1-.22.128c-.333.183-.582.495-.646.87l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.607 6.607 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.844c-.008-.379-.137-.753-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124a6.607 6.607 0 0 1 .22-.128c.333-.183.582.495.646.87l.213-1.28Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

export const AboutIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

export const HyperIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

export const FileExplorerIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.25a3 3 0 01-2.65-1.5L9.9 3.45A3 3 0 007.25 2H4.5a3 3 0 00-3 3v13.5a3 3 0 003 3h15z" />
  </svg>
);

export const NotebookIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

export const CloseIcon: React.FC<AppIconProps> = ({className = 'w-4 h-4'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const MinimizeIcon: React.FC<AppIconProps> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

export const MaximizeIcon: React.FC<AppIconProps> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15"
    />
  </svg>
);
export const RestoreIcon: React.FC<AppIconProps> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

export const BrowserIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c1.358 0 2.662-.33 3.797-.938M12 21c-1.358 0-2.662-.33-3.797-.938m0 0a9.004 9.004 0 01-4.28-4.28m0 0a9.004 9.004 0 014.28-4.28m0 0a8.957 8.957 0 018.598 0m0 0a9.004 9.004 0 014.28 4.28m0 0a9.004 9.004 0 01-4.28 4.28M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
    />
  </svg>
);

export const Browser2Icon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <div className={`relative ${isSmall ? 'w-5 h-5' : className}`}>
    <BrowserIcon className="w-full h-full" isSmall={isSmall} />
    <span
      className={`absolute bg-blue-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-black/80
            ${isSmall ? 'text-[8px] w-3.5 h-3.5 -bottom-0.5 -right-0.5' : 'text-[10px] w-4 h-4 -bottom-1 -right-1'}`}
    >
      2
    </span>
  </div>
);

export const Browser3Icon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <div className={`relative ${isSmall ? 'w-5 h-5' : className}`}>
    <BrowserIcon className="w-full h-full" isSmall={isSmall} />
    <span
      className={`absolute bg-green-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-black/80
            ${isSmall ? 'text-[8px] w-3.5 h-3.5 -bottom-0.5 -right-0.5' : 'text-[10px] w-4 h-4 -bottom-1 -right-1'}`}
    >
      3
    </span>
  </div>
);

export const Browser4Icon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <div className={`relative ${isSmall ? 'w-5 h-5' : className}`}>
    <BrowserIcon className="w-full h-full" isSmall={isSmall} />
    <span
      className={`absolute bg-orange-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-black/80
            ${isSmall ? 'text-[8px] w-3.5 h-3.5 -bottom-0.5 -right-0.5' : 'text-[10px] w-4 h-4 -bottom-1 -right-1'}`}
    >
      4
    </span>
  </div>
);

export const Browser6Icon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <div className={`relative ${isSmall ? 'w-5 h-5' : className}`}>
    <BrowserIcon className="w-full h-full" isSmall={isSmall} />
    <span
      className={`absolute bg-purple-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-black/80
            ${isSmall ? 'text-[8px] w-3.5 h-3.5 -bottom-0.5 -right-0.5' : 'text-[10px] w-4 h-4 -bottom-1 -right-1'}`}
    >
      6
    </span>
  </div>
);

export const Browser7Icon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <div className={`relative ${isSmall ? 'w-5 h-5' : className}`}>
    <BrowserIcon className="w-full h-full" isSmall={isSmall} />
    <span
      className={`absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-black/80
            ${isSmall ? 'text-[8px] w-3.5 h-3.5 -bottom-0.5 -right-0.5' : 'text-[10px] w-4 h-4 -bottom-1 -right-1'}`}
    >
      7
    </span>
  </div>
);

export const SftpIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
    />
  </svg>
);

export const StoreIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.452c-.656 0-1.19-.585-1.119-1.243l1.263-12a1.125 1.125 0 011.12-1.007h8.898c.613 0 1.12.47 1.12 1.007z"
    />
  </svg>
);

export const RefreshIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M6.176 9.348a8.25 8.25 0 0111.664 0l3.181 3.183m0 0h-4.992m4.992 0v4.992"
    />
  </svg>
);

export const ThemeIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622 3.385m-5.043-.025a15.998 15.998 0 01-3.388 1.622m0-11.218a15.998 15.998 0 013.388 1.62M15 7.5l-3 3m0 0l-3-3m3 3v11.25m6-2.25h-5.25M7.5 15h5.25"
    />
  </svg>
);

// --- File Explorer Icons ---
export const FolderIcon: React.FC<AppIconProps> = ({
  className = 'w-12 h-12',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      fillRule="evenodd"
      d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.25a3 3 0 01-2.65-1.5L9.9 3.45A3 3 0 007.25 2H4.5a3 3 0 00-3 3v13.5a3 3 0 003 3h15z"
      clipRule="evenodd"
    />
  </svg>
);

export const FileCodeIcon: React.FC<AppIconProps> = ({
  className = 'w-12 h-12',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      fillRule="evenodd"
      d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a.375.375 0 01-.375-.375V6.75A3.75 3.75 0 009 3H5.625zM12.75 12.31l-2.47 2.47a.75.75 0 01-1.06-1.06L10.94 12l-1.72-1.72a.75.75 0 111.06-1.06l2.47 2.47a.75.75 0 010 1.06zm3.75-1.06l-2.47-2.47a.75.75 0 10-1.06 1.06L14.69 12l-1.72 1.72a.75.75 0 101.06 1.06l2.47-2.47a.75.75 0 000-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export const FileJsonIcon: React.FC<AppIconProps> = ({
  className = 'w-12 h-12',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      fillRule="evenodd"
      d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a.375.375 0 01-.375-.375V6.75A3.75 3.75 0 009 3H5.625zM10.5 12a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008a.75.75 0 01.75-.75h.008zM12 13.5a.75.75 0 00-.75-.75h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008zM12.75 12a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008a.75.75 0 01.75-.75h.008zM13.5 13.5a.75.75 0 00-.75-.75h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008zM14.25 12a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008a.75.75 0 01.75-.75h.008z"
      clipRule="evenodd"
    />
  </svg>
);

export const FileGenericIcon: React.FC<AppIconProps> = ({
  className = 'w-12 h-12',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      fillRule="evenodd"
      d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a2.25 2.25 0 000 3.182l10.94 10.94a2.25 2.25 0 003.182-3.182L9.621 16.25a.75.75 0 01-1.06-1.061l8.368-8.368a2.25 2.25 0 00-3.182-3.182L4.08 13.28a.75.75 0 01-1.06-1.06l9.72-9.72a2.25 2.25 0 000-3.182z"
      clipRule="evenodd"
    />
    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a.375.375 0 01-.375-.375V6.75A3.75 3.75 0 009 3H5.625z" />
  </svg>
);

export const StarIcon: React.FC<AppIconProps> = ({className = 'w-4 h-4'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z"
      clipRule="evenodd"
    />
  </svg>
);

export const WifiIcon: React.FC<AppIconProps> = ({className = 'w-5 h-5'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.75 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

export const SoundIcon: React.FC<AppIconProps> = ({className = 'w-5 h-5'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
    />
  </svg>
);

export const BatteryIcon: React.FC<AppIconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 9v6h15V9h-15Z"
    />{' '}
    {/* Adjusted to make it look fuller */}
  </svg>
);

export const TASKBAR_HEIGHT = 48; // in pixels
export const DEFAULT_WINDOW_WIDTH = 600;
export const DEFAULT_WINDOW_HEIGHT = 400;

export const GeminiIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path d="M12 2.25a.75.75 0 0 1 .75.75v3.023c0 .38-.158.75-.44 1.032l-3.033 3.033a1.5 1.5 0 0 1-2.122 0l-3.033-3.033A1.5 1.5 0 0 1 4.23 6.023V3a.75.75 0 0 1 .75-.75h6zm-3.75 9a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 .75.75h3.023c.38 0 .75-.158 1.032-.44l3.033-3.033a1.5 1.5 0 0 0 0-2.122l-3.033-3.033a1.5 1.5 0 0 0-1.032-.44H8.25zm9-3.75a.75.75 0 0 1 .75.75v3.023c0 .38.158.75.44 1.032l3.033 3.033a1.5 1.5 0 0 1 0 2.122l-3.033 3.033a1.5 1.5 0 0 1-1.032.44h-3.023a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75h3.023c-.38 0-.75.158-1.032.44l-3.033 3.033a1.5 1.5 0 0 0 0 2.122l3.033 3.033a1.5 1.5 0 0 0 1.032.44h.001z" />
  </svg>
);

export const LightbulbIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a15.045 15.045 0 01-7.5 0C4.508 19.64 2.25 15.223 2.25 10.5 2.25 6.23 5.78 3 10.125 3c4.345 0 7.875 3.23 7.875 7.5 0 4.723-2.258 9.14-6.375 10.655z"
    />
  </svg>
);

export const UserIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

export const CopyIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375m0-13.5h3.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375m0-13.5V7.875c0-.621.504-1.125 1.125-1.125H6.75"
    />
  </svg>
);

export const CheckIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

export const AppStoreIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  isSmall,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={isSmall ? 'w-5 h-5' : className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.452c-.656 0-1.19-.585-1.119-1.243l1.263-12a1.125 1.125 0 011.12-1.007h8.898c.613 0 1.12.47 1.12 1.007z"
    />
  </svg>
);
