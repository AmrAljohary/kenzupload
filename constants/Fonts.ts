export const FONTS = {
    BLACK: "somar-black",
    BLACK_ITALIC: "somar-black-italic",
    BOLD: "somar-bold",
    BOLD_ITALIC: "somar-bold-italic",
    EXTRABOLD: "somar-extrabold",
    EXTRABOLD_ITALIC: "somar-extrabold-italic",
    EXTRALIGHT: "somar-extralight",
    EXTRALIGHT_ITALIC: "somar-extralight-italic",
    LIGHT: "somar-light",
    LIGHT_ITALIC: "somar-light-italic",
    MEDIUM: "somar-medium",
    MEDIUM_ITALIC: "somar-medium-italic",
    REGULAR: "somar-regular",
    REGULAR_ITALIC: "somar-regular-italic",
    SEMIBOLD: "somar-semibold",
    SEMIBOLD_ITALIC: "somar-semibold-italic",
    THIN: "somar-thin",
    THIN_ITALIC: "somar-thin-italic",
    SPACE_MONO: "space-mono",
};

/**
 * اختر الخط المناسب حسب الوزن والنمط
 * @param weight الوزن: "thin" | "extralight" | "light" | "regular" | "medium" | "semibold" | "bold" | "extrabold" | "black"
 * @param italic هل هو مائل: true | false
 * @returns اسم الخط المناسب
 */
export function getFont(
    weight:
        | "thin"
        | "extralight"
        | "light"
        | "regular"
        | "medium"
        | "semibold"
        | "bold"
        | "extrabold"
        | "black" = "regular",
    italic: boolean = false
): string {
    if (weight === "thin") return italic ? FONTS.THIN_ITALIC : FONTS.THIN;
    if (weight === "extralight")
        return italic ? FONTS.EXTRALIGHT_ITALIC : FONTS.EXTRALIGHT;
    if (weight === "light") return italic ? FONTS.LIGHT_ITALIC : FONTS.LIGHT;
    if (weight === "medium") return italic ? FONTS.MEDIUM_ITALIC : FONTS.MEDIUM;
    if (weight === "semibold")
        return italic ? FONTS.SEMIBOLD_ITALIC : FONTS.SEMIBOLD;
    if (weight === "bold") return italic ? FONTS.BOLD_ITALIC : FONTS.BOLD;
    if (weight === "extrabold")
        return italic ? FONTS.EXTRABOLD_ITALIC : FONTS.EXTRABOLD;
    if (weight === "black") return italic ? FONTS.BLACK_ITALIC : FONTS.BLACK;

    // الافتراضي هو العادي
    return italic ? FONTS.REGULAR_ITALIC : FONTS.REGULAR;
}

export default FONTS;
