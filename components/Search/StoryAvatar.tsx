import { View } from 'react-native';
import React from 'react';
import { Circle, Svg } from 'react-native-svg';
import FastImage from 'react-native-fast-image';

const StoryAvatar = ({
  size = 100,
  progress = 0,
  imageSrc,
  style
}: {
  size?: number;
  progress?: number;
  imageSrc?: string;
  style?: any;
}) => {
  let strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={[style,{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
        //   stroke={Colors.lWhite}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
        //   stroke={Colors.black}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {imageSrc && (
        <FastImage
          source={{uri: imageSrc}}
          style={{
            width: size - 5,
            height: size - 5,
            borderRadius: size,
            position: 'absolute',
          }}
        />
      )}
    </View>
  );
};

export default StoryAvatar;
