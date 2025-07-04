import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function Home(props) {
    return (
        <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={25}
            height={25}
            fill="none"
            {...props}
        >
            <Path
                stroke={props.borderColor}
                strokeWidth={1.5}
                d="M2.1 12.704c0-2.289 0-3.433.52-4.381.518-.949 1.467-1.537 3.364-2.715l2-1.241C9.989 3.122 10.992 2.5 12.1 2.5c1.108 0 2.11.622 4.116 1.867l2 1.241c1.897 1.178 2.846 1.766 3.365 2.715.519.948.519 2.092.519 4.38v1.522c0 3.9 0 5.851-1.172 7.063C19.757 22.5 17.871 22.5 14.1 22.5h-4c-3.771 0-5.657 0-6.828-1.212C2.1 20.076 2.1 18.126 2.1 14.225v-1.521Z"
            />
            <Path
                stroke={props.borderColor}
                strokeLinecap="round"
                strokeWidth={1.5}
                d="M9.1 16.5c.85.63 1.885 1 3 1s2.15-.37 3-1"
            />
        </Svg>
    );
}
