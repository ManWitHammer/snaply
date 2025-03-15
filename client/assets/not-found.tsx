import * as React from "react"
import Svg, { SvgProps, Path, Ellipse } from "react-native-svg"
const NotFound = (props: SvgProps) => (
  <Svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    {...props}
  >
    <Path
      d="M39.49 6.554A33.177 33.177 0 0 0 6.313 39.731a33.177 33.177 0 0 0 7.512 20.935A31.171 31.171 0 0 1 39.49 47.091a31.171 31.171 0 0 1 25.695 13.536 33.177 33.177 0 0 0 7.482-20.896A33.177 33.177 0 0 0 39.49 6.554zm0 9.913a14.07 14.07 0 0 1 14.07 14.07 14.07 14.07 0 0 1-14.07 14.07 14.07 14.07 0 0 1-14.07-14.07 14.07 14.07 0 0 1 14.07-14.07z"
      opacity={0.99}
      fill="#cecfcf"
      stroke="#cecfcf"
      strokeWidth={3.64638}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Ellipse
      cx={39.496}
      cy={40.35}
      rx={35.128}
      ry={35.793}
      opacity={0.99}
      fill="none"
      stroke="#cecfcf"
      strokeWidth={4.99999}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={1}
    />
  </Svg>
)
export default NotFound
