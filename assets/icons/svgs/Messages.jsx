import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function Messages(props) {
    return (
        <Svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={19}
            fill="none"
            {...props}
        >
            <Path
                stroke={props.borderColor}
                fillRule="evenodd"
                d="M16.4213 5.24543C15.2182 4.1587 13.1915 3.75 10 3.75C6.80854 3.75 4.78184 4.1587 3.5788 5.24543M16.4213 5.24543C17.5003 6.22011 17.9167 7.74019 17.9167 10C17.9167 14.7794 16.054 16.25 10 16.25C3.94612 16.25 2.08337 14.7794 2.08337 10C2.08337 7.74019 2.49981 6.22011 3.5788 5.24543M16.4213 5.24543L11.1785 10.4881C10.5277 11.139 9.47239 11.139 8.82151 10.4881L3.5788 5.24543"
                clipRule="evenodd"
            />
        </Svg>
    );
}
