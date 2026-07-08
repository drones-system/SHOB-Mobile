import React from 'react';
import Svg, { Path } from 'react-native-svg';


export const GPSIcon = ({ size = 21, color = '#DA372E' }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
        <Path d="M16.067 4.19972L11.2931 15.6054L9.44656 10.8202L8.5233 10.4599L4.66135 8.96241L16.067 4.19972ZM20.2668 0L0 8.47826V9.58167L7.70137 12.5654L10.6738 20.2668H11.7772L20.2668 0Z" fill={color} />
    </Svg>
);