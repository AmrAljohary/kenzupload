import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function SaveTab(props) {
    return (
        <Svg
            width="26"
            height="24"
            viewBox="0 0 26 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <Path
                d="M13 21.0009L10.25 19.5208C9.84 19.2908 9.15999 19.2908 8.73999 19.5208L4.81 21.7108C3.54 22.4208 2.5 21.8009 2.5 20.3509V8.99084C2.5 7.28084 3.89999 5.88086 5.60999 5.88086H13.39C15.1 5.88086 16.5 7.28084 16.49 8.99084V13.0009"
                stroke={props.stroke}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <Path
                d="M13 21.0009L10.26 19.5208C9.84001 19.2908 9.15999 19.2908 8.73999 19.5208L4.81 21.7108C3.54 22.4108 2.5 21.8009 2.5 20.3509V8.99084C2.5 7.28084 3.89999 5.88086 5.60999 5.88086H13.39C15.1 5.88086 16.5 7.28084 16.5 8.99084V13.0009"
                stroke={props.stroke}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <Path
                d="M22.5 11.5V5.10999C22.5 3.39999 21.1 2 19.39 2H11.61C9.89999 2 8.5 3.39999 8.5 5.10999V5.88H13.39C15.1 5.88 16.5 7.27999 16.5 8.98999"
                stroke={props.stroke}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <Path
                d="M18.1 18.2V17.4C18.1 16.07 18.5 15 20.5 15C22.5 15 22.9 16.07 22.9 17.4V18.2"
                stroke={props.stroke}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <Path
                d="M22.5 22.9993H18.5C16.9 22.9993 16.5 22.5993 16.5 20.9993V20.1992C16.5 18.5992 16.9 18.1992 18.5 18.1992H22.5C24.1 18.1992 24.5 18.5992 24.5 20.1992V20.9993C24.5 22.5993 24.1 22.9993 22.5 22.9993Z"
                stroke={props.stroke}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </Svg>
    );
}
