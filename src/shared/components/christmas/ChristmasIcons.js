import React from 'react';

// Christmas Tree Icon
export const ChristmasTreeIcon = ({ size = 24, color = "#228B22" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L8 8H6L10 14H8L12 20L16 14H14L18 8H16L12 2Z" fill={color}/>
    <rect x="11" y="20" width="2" height="2" fill="#8B4513"/>
  </svg>
);

// Christmas Star Icon
export const ChristmasStarIcon = ({ size = 24, color = "#FFD700" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.5 8.5H20L15 12.5L16.5 19L12 15L7.5 19L9 12.5L4 8.5H10.5L12 2Z" fill={color}/>
  </svg>
);

// Christmas Gift Icon
export const ChristmasGiftIcon = ({ size = 24, color = "#DC143C" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="6" width="16" height="12" fill={color}/>
    <rect x="4" y="6" width="16" height="3" fill="#228B22"/>
    <rect x="11" y="2" width="2" height="16" fill="#228B22"/>
  </svg>
);

// Christmas Bell Icon
export const ChristmasBellIcon = ({ size = 24, color = "#FFD700" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8 2 5 5 5 9C5 11 6 13 8 14V18C8 19 9 20 10 20H14C15 20 16 19 16 18V14C18 13 19 11 19 9C19 5 16 2 12 2Z" fill={color}/>
    <rect x="11" y="20" width="2" height="2" fill="#8B4513"/>
  </svg>
);

// Christmas Snowflake Icon
export const ChristmasSnowflakeIcon = ({ size = 24, color = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L12 22M2 12L22 12M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5M12 2L8 8L12 12L16 8L12 2M12 12L8 16L12 20L16 16L12 12M12 2L16 8L12 12L8 8L12 2M12 12L16 16L12 20L8 16L12 12" stroke={color} strokeWidth="1.5" fill="none"/>
  </svg>
);

// Christmas Candy Cane Icon
export const ChristmasCandyCaneIcon = ({ size = 24, color = "#DC143C" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M8 2L8 22" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 2L8 8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 10L8 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 18L8 22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// Christmas Holly Icon
export const ChristmasHollyIcon = ({ size = 24, color = "#228B22" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C10 4 8 6 8 8C8 10 10 12 12 12C14 12 16 10 16 8C16 6 14 4 12 2Z" fill={color}/>
    <path d="M12 12C10 14 8 16 8 18C8 20 10 22 12 22C14 22 16 20 16 18C16 16 14 14 12 12Z" fill={color}/>
    <circle cx="6" cy="6" r="2" fill="#DC143C"/>
    <circle cx="18" cy="6" r="2" fill="#DC143C"/>
    <circle cx="6" cy="18" r="2" fill="#DC143C"/>
    <circle cx="18" cy="18" r="2" fill="#DC143C"/>
  </svg>
);

// Christmas Wreath Icon
export const ChristmasWreathIcon = ({ size = 24, color = "#228B22" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1" fill="none"/>
    <path d="M12 2L14 6L18 6L15 9L16 13L12 11L8 13L9 9L6 6L10 6L12 2Z" fill="#FFD700"/>
  </svg>
);

// Christmas Ornament Icon
export const ChristmasOrnamentIcon = ({ size = 24, color = "#DC143C" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="14" rx="6" ry="8" fill={color}/>
    <rect x="11" y="2" width="2" height="4" fill="#8B4513"/>
    <circle cx="12" cy="6" r="1" fill="#FFD700"/>
  </svg>
);

// Christmas Sleigh Icon
export const ChristmasSleighIcon = ({ size = 24, color = "#8B4513" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 18L22 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 16L20 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 14L18 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12L16 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 10L14 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8L12 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Christmas Reindeer Icon
export const ChristmasReindeerIcon = ({ size = 24, color = "#8B4513" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="8" rx="4" ry="3" fill={color}/>
    <ellipse cx="8" cy="6" rx="1" ry="1" fill="#000000"/>
    <ellipse cx="16" cy="6" rx="1" ry="1" fill="#000000"/>
    <path d="M12 11L12 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 15L6 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 15L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 8L4 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 8L20 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Christmas Fireplace Icon
export const ChristmasFireplaceIcon = ({ size = 24, color = "#8B4513" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="8" width="16" height="14" fill={color}/>
    <rect x="6" y="6" width="12" height="2" fill="#DC143C"/>
    <path d="M8 10L10 16L12 12L14 18L16 10" stroke="#FFD700" strokeWidth="2" fill="none"/>
    <circle cx="10" cy="14" r="1" fill="#FF4500"/>
    <circle cx="14" cy="16" r="1" fill="#FF4500"/>
  </svg>
);

// Christmas Stocking Icon
export const ChristmasStockingIcon = ({ size = 24, color = "#DC143C" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M8 4L8 20C8 21 9 22 10 22H14C15 22 16 21 16 20L16 4L8 4Z" fill={color}/>
    <rect x="8" y="2" width="8" height="2" fill="#FFFFFF"/>
    <path d="M10 8L14 8M10 12L14 12M10 16L14 16" stroke="#FFFFFF" strokeWidth="1"/>
  </svg>
);

// Christmas Cookie Icon
export const ChristmasCookieIcon = ({ size = 24, color = "#DEB887" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color}/>
    <circle cx="8" cy="8" r="1" fill="#8B4513"/>
    <circle cx="16" cy="8" r="1" fill="#8B4513"/>
    <circle cx="8" cy="16" r="1" fill="#8B4513"/>
    <circle cx="16" cy="16" r="1" fill="#8B4513"/>
    <circle cx="12" cy="12" r="1" fill="#8B4513"/>
    <path d="M6 12L18 12" stroke="#8B4513" strokeWidth="1"/>
    <path d="M12 6L12 18" stroke="#8B4513" strokeWidth="1"/>
  </svg>
);

// Christmas Hot Chocolate Icon
export const ChristmasHotChocolateIcon = ({ size = 24, color = "#8B4513" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="6" y="8" width="12" height="12" fill={color}/>
    <rect x="6" y="6" width="12" height="2" fill="#FFFFFF"/>
    <path d="M8 4L8 6M10 4L10 6M12 4L12 6M14 4L14 6M16 4L16 6" stroke="#8B4513" strokeWidth="1"/>
    <circle cx="10" cy="14" r="1" fill="#FFFFFF"/>
    <circle cx="14" cy="16" r="1" fill="#FFFFFF"/>
  </svg>
);

// Christmas Candle Icon
export const ChristmasCandleIcon = ({ size = 24, color = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="10" y="4" width="4" height="16" fill={color}/>
    <rect x="9" y="2" width="6" height="2" fill="#8B4513"/>
    <path d="M12 2L12 0" stroke="#FF4500" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="1" r="1" fill="#FF4500"/>
  </svg>
);

// Christmas Angel Icon
export const ChristmasAngelIcon = ({ size = 24, color = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="6" r="3" fill={color}/>
    <path d="M12 9L12 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12L16 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 16L18 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 20L20 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L14 4L12 6L10 4L12 2Z" fill="#FFD700"/>
  </svg>
);

// Export all icons as a collection
export const ChristmasIcons = {
  Tree: ChristmasTreeIcon,
  Star: ChristmasStarIcon,
  Gift: ChristmasGiftIcon,
  Bell: ChristmasBellIcon,
  Snowflake: ChristmasSnowflakeIcon,
  CandyCane: ChristmasCandyCaneIcon,
  Holly: ChristmasHollyIcon,
  Wreath: ChristmasWreathIcon,
  Ornament: ChristmasOrnamentIcon,
  Sleigh: ChristmasSleighIcon,
  Reindeer: ChristmasReindeerIcon,
  Fireplace: ChristmasFireplaceIcon,
  Stocking: ChristmasStockingIcon,
  Cookie: ChristmasCookieIcon,
  HotChocolate: ChristmasHotChocolateIcon,
  Candle: ChristmasCandleIcon,
  Angel: ChristmasAngelIcon
};

export default ChristmasIcons;
