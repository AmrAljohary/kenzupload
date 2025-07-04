import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function VideoTab(props) {
    return (
        <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={25}
            height={24}
            fill="none"
            {...props}
        >
            <Path
                fill={props.fill}
                d="M15.23 2H9.77v4.36h5.46V2ZM16.73 2v4.36h5.64c-.51-2.75-2.54-4.35-5.64-4.36ZM2.5 7.86v8.33C2.5 19.83 4.67 22 8.31 22h8.38c3.64 0 5.81-2.17 5.81-5.81V7.86h-20Zm12.44 8.32-2.08 1.2c-.44.25-.87.38-1.27.38-.3 0-.57-.07-.82-.21-.58-.33-.9-1.01-.9-1.89v-2.4c0-.88.32-1.56.9-1.89.58-.34 1.32-.28 2.09.17l2.08 1.2c.77.44 1.19 1.06 1.19 1.73 0 .67-.43 1.26-1.19 1.71ZM8.27 2c-3.1.01-5.13 1.61-5.64 4.36h5.64V2Z"
            />
        </Svg>
    );
}
