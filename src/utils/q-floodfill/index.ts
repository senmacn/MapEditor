/**
 * 修改基于 q-floodfill
 */

import FloodFill from './FloodFill'
import {
    isSameColor,
    setColorAtPixel,
    getColorAtPixel,
    colorToRGBA,
    hex2RGBA,
    ColorRGBA,
} from './colorUtils'

export default FloodFill
export {
    isSameColor,
    setColorAtPixel,
    getColorAtPixel,
    colorToRGBA,
    hex2RGBA
}

export type { ColorRGBA }

