import {createTheme, IPalette, DefaultPalette} from "@fluentui/react";

const rightPaneDefaultButtonPalette = {
    themePrimary: "#E9ECEF",
    themeLighterAlt: "#ebeef1",
    themeLighter: "#edf0f3",
    themeLight: "#f0f2f5",
    themeTertiary: "#f2f4f6",
    themeSecondary: "#f5f6f8",
    themeDarkAlt: "#f7f9fa",
    themeDark: "#fafbfb",
    themeDarker: "#fcfdfd",
    neutralLighterAlt: "#35393e",
    neutralLighter: "#3c4046",
    neutralLight: "#484c53",
    neutralQuaternaryAlt: "#50545b",
    neutralQuaternary: "#565a61",
    neutralTertiaryAlt: "#70747c",
    neutralTertiary: "#f0f2f5",
    neutralSecondary: "#f2f4f6",
    neutralPrimaryAlt: "#f5f6f8",
    neutralPrimary: "#E9ECEF",
    neutralDark: "#fafbfb",
    black: "#fcfdfd",
    white: "#2D3035"
  }

const greenButtonPalette = {
    themePrimary: "#78ad0e",
    themeLighterAlt: "#050701",
    themeLighter: "#131c02",
    themeLight: "#243404",
    themeTertiary: "#486808",
    themeSecondary: "#6a990c",
    themeDarkAlt: "#83b61f",
    themeDark: "#94c13a",
    themeDarker: "#add165",
    neutralLighterAlt: "#393e43",
    neutralLighter: "#40454b",
    neutralLight: "#4c5157",
    neutralQuaternaryAlt: "#53585f",
    neutralQuaternary: "#595f65",
    neutralTertiaryAlt: "#73787f",
    neutralTertiary: "#dfdfdf",
    neutralSecondary: "#e4e4e4",
    neutralPrimaryAlt: "#e9e9e9",
    neutralPrimary: "#cfcfcf",
    neutralDark: "#f4f4f4",
    black: "#f9f9f9",
    white: "#32363B",
};

const darkGreyPalette = {
    themePrimary: "#E5E6E6",
    themeLighterAlt: "#e8e8e8",
    themeLighter: "#ebebeb",
    themeLight: "#eeeeee",
    themeTertiary: "#f1f1f1",
    themeSecondary: "#f4f4f4",
    themeDarkAlt: "#f6f6f6",
    themeDark: "#f9f9f9",
    themeDarker: "#fcfcfc",
    neutralLighterAlt: "#26282d",
    neutralLighter: "#2d3036",
    neutralLight: "#3a3d43",
    neutralQuaternaryAlt: "#42454c",
    neutralQuaternary: "#484c53",
    neutralTertiaryAlt: "#646870",
    neutralTertiary: "#eeeeee",
    neutralSecondary: "#f1f1f1",
    neutralPrimaryAlt: "#f4f4f4",
    neutralPrimary: "#E5E6E6",
    neutralDark: "#f9f9f9",
    black: "#fcfcfc",
    white: "#1E2024",
  };

const whiteButtonPalette = {
    themePrimary: "white",
    themeLighterAlt: "#767676",
    themeLighter: "#a6a6a6",
    themeLight: "#c8c8c8",
    themeTertiary: "#d0d0d0",
    themeSecondary: "#dadada",
    themeDarkAlt: "#eaeaea",
    themeDark: "#f4f4f4",
    themeDarker: "#f8f8f8",
    neutralLighterAlt: "#393e43",
    neutralLighter: "#40454b",
    neutralLight: "#4c5157",
    neutralQuaternaryAlt: "#53585f",
    neutralQuaternary: "#595f65",
    neutralTertiaryAlt: "#73787f",
    neutralTertiary: "#dfdfdf",
    neutralSecondary: "#e4e4e4",
    neutralPrimaryAlt: "#e9e9e9",
    neutralPrimary: "#cfcfcf",
    neutralDark: "#f4f4f4",
    black: "#f9f9f9",
    white: "#32363B",
};

const redButtonPalette = {
    themePrimary: "#f2635e",
    themeLighterAlt: "#0a0404",
    themeLighter: "#27100f",
    themeLight: "#491e1c",
    themeTertiary: "#913c39",
    themeSecondary: "#d55753",
    themeDarkAlt: "#f4726e",
    themeDark: "#f58784",
    themeDarker: "#f8a6a3",
    neutralLighterAlt: "#262a2f",
    neutralLighter: "#262a2e",
    neutralLight: "#24282c",
    neutralQuaternaryAlt: "#222529",
    neutralQuaternary: "#202328",
    neutralTertiaryAlt: "#1f2226",
    neutralTertiary: "#f0f2f5",
    neutralSecondary: "#f2f4f6",
    neutralPrimaryAlt: "#f5f6f8",
    neutralPrimary: "#e9ecef ",
    neutralDark: "#fafbfb",
    black: "#fcfdfd",
    white: "#272B30",
};

const greyButtonPalette = {
    themePrimary: "#949799",
    themeLighterAlt: "#060606",
    themeLighter: "#181818",
    themeLight: "#2d2d2e",
    themeTertiary: "#595b5c",
    themeSecondary: "#838587",
    themeDarkAlt: "#9fa1a3",
    themeDark: "#adb0b1",
    themeDarker: "#c3c4c6",
    neutralLighterAlt: "#262a2f",
    neutralLighter: "#383e44",
    neutralLight: "#24282c",
    neutralQuaternaryAlt: "#222529",
    neutralQuaternary: "#202328",
    neutralTertiaryAlt: "#1f2226",
    neutralTertiary: "#f0f2f5",
    neutralSecondary: "#f2f4f6",
    neutralPrimaryAlt: "#f5f6f8",
    neutralPrimary: "#e9ecef",
    neutralDark: "#fafbfb",
    black: "#fcfdfd",
    white: "#272B30",
};

const blueButtonPalette = {
    themePrimary: "#5bc0de",
    themeLighterAlt: "#040809",
    themeLighter: "#0f1f23",
    themeLight: "#1b3943",
    themeTertiary: "#377385",
    themeSecondary: "#50a8c3",
    themeDarkAlt: "#6ac5e1",
    themeDark: "#7fcee6",
    themeDarker: "#9edaec",
    neutralLighterAlt: "#262a2f",
    neutralLighter: "#262a2e",
    neutralLight: "#24282c",
    neutralQuaternaryAlt: "#222529",
    neutralQuaternary: "#202328",
    neutralTertiaryAlt: "#1f2226",
    neutralTertiary: "#f0f2f5",
    neutralSecondary: "#f2f4f6",
    neutralPrimaryAlt: "#f5f6f8",
    neutralPrimary: "#e9ecef",
    neutralDark: "#fafbfb",
    black: "#fcfdfd",
    white: "#272b30",
};

const darkThemePalette  = {
    neutralLighterAlt: "#282828",
    neutralLighter: "#313131",
    neutralLight: "#3f3f3f",
    neutralQuaternaryAlt: "#484848",
    neutralQuaternary: "#4f4f4f",
    neutralTertiaryAlt: "#6d6d6d",
    neutralTertiary: "#c8c8c8",
    neutralSecondary: "#d0d0d0",
    neutralPrimaryAlt: "#dadada",
    neutralPrimary: "#ffffff",
    neutralDark: "#f4f4f4",
    black: "#f8f8f8",
    white: "#1f1f1f",
    themePrimary: "#ffffff",
    themeLighterAlt: "#020609",
    themeLighter: "#091823",
    themeLight: "#112d43",
    themeTertiary: "#235a85",
    themeSecondary: "#3385c3",
    themeDarkAlt: "#4ba0e1",
    themeDark: "#65aee6",
    themeDarker: "#8ac2ec",
    accent: "#3a96dd",
};

const greenWithWhiteBackgroundPalette = {
    themePrimary: "#78ad0e",
    themeLighterAlt: "#f9fcf2",
    themeLighter: "#e6f2ce",
    themeLight: "#d1e7a7",
    themeTertiary: "#a8ce5c",
    themeSecondary: "#86b723",
    themeDarkAlt: "#6c9c0c",
    themeDark: "#5b840b",
    themeDarker: "#436108",
    neutralLighterAlt: "#faf9f8",
    neutralLighter: "#f3f2f1",
    neutralLight: "#edebe9",
    neutralQuaternaryAlt: "#e1dfdd",
    neutralQuaternary: "#d0d0d0",
    neutralTertiaryAlt: "#c8c6c4",
    neutralTertiary: "#a19f9d",
    neutralSecondary: "#605e5c",
    neutralPrimaryAlt: "#3b3a39",
    neutralPrimary: "#323130",
    neutralDark: "#201f1e",
    black: "#000000",
    white: "#ffffff",
  };

const DarkDefaultPalette: Partial<IPalette> = {
    themeDarker: "#82c7ff",
    themeDark: "#6cb8f6",
    themeDarkAlt: "#3aa0f3",
    themePrimary: "#2899f5",
    themeSecondary: "#0078d4",
    themeTertiary: "#235a85",
    themeLight: "#004c87",
    themeLighter: "#043862",
    themeLighterAlt: "#092c47",
    black: "#ffffff",
    neutralDark: "#faf9f8",
    neutralPrimary: "#f3f2f1",
    neutralPrimaryAlt: "#c8c6c4",
    neutralSecondary: "#a19f9d",
    neutralSecondaryAlt: "#979693",
    neutralTertiary: "#797775",
    neutralTertiaryAlt: "#484644",
    neutralQuaternary: "#3b3a39",
    neutralQuaternaryAlt: "#323130",
    neutralLight: "#292827",
    neutralLighter: "#252423",
    neutralLighterAlt: "#201f1e",
    white: "#1b1a19",
    redDark: "#F1707B",
};

const lightGreyPalette = {
    themePrimary: "#B8B8B9",
    themeLighterAlt: "#070707",
    themeLighter: "#1d1d1e",
    themeLight: "#373738",
    themeTertiary: "#6f6f70",
    themeSecondary: "#a2a2a4",
    themeDarkAlt: "#bfbfc1",
    themeDark: "#c9c9cb",
    themeDarker: "#d7d7d8",
    neutralLighterAlt: "#4e5257",
    neutralLighter: "#55595d",
    neutralLight: "#606469",
    neutralQuaternaryAlt: "#666b6f",
    neutralQuaternary: "#6c7075",
    neutralTertiaryAlt: "#83888c",
    neutralTertiary: "#373738",
    neutralSecondary: "#6f6f70",
    neutralPrimaryAlt: "#a2a2a4",
    neutralPrimary: "#B8B8B9",
    neutralDark: "#c9c9cb",
    black: "#d7d7d8",
    white: "#474B4F"
}

const subMenuPalette = {
    themePrimary: "#f5f5f5",
    themeLighterAlt: "#dadada",
    themeLighter: "#bfbfbf",
    themeLight: "#a4a4a4",
    themeTertiary: "#898989",
    themeSecondary: "#6e6e6e",
    themeDarkAlt: "#535353",
    themeDark: "#383838",
    themeDarker: "#1d1d1d",
    neutralLighterAlt: "#3f4246",
    neutralLighter: "#464a4d",
    neutralLight: "#525559",
    neutralQuaternaryAlt: "#595d61",
    neutralQuaternary: "#5f6367",
    neutralTertiaryAlt: "#787d81",
    neutralTertiary: "#e9e9e9",
    neutralSecondary: "#ececec",
    neutralPrimaryAlt: "#f0f0f0",
    neutralPrimary: "#dedede",
    neutralDark: "#f7f7f7",
    black: "#fbfbfb",
    white: "#373a3d"
}


const rightPaneDefaultButtonTheme = createTheme({palette: rightPaneDefaultButtonPalette});
const defaultDarkTheme = createTheme({palette: DarkDefaultPalette});
const defaultTheme = createTheme({palette: DefaultPalette});
const whiteTheme = createTheme({palette: whiteButtonPalette});
const redTheme = createTheme({palette: redButtonPalette});
const greenTheme = createTheme({palette: greenButtonPalette});
const greyTheme = createTheme({palette: greyButtonPalette});
const blueTheme = createTheme({palette: blueButtonPalette});
const darkTheme = createTheme({palette: darkThemePalette});
const darkGreyTheme = createTheme({palette: darkGreyPalette});
const greenWithWhiteBackgroundTheme = createTheme({palette: greenWithWhiteBackgroundPalette});
const lightGreyTheme = createTheme({palette: lightGreyPalette});
const subMenuTheme = createTheme({palette: subMenuPalette})

export function getRightPaneDefaultButtonTheme() {
    return rightPaneDefaultButtonTheme;
}

export function getPrimaryWhiteTheme() {
    return whiteTheme;
}

export function getDarkGreyTheme() {
    return darkGreyTheme;
}

export function getPrimaryRedTheme() {
    return redTheme;
}

export function getPrimaryGreenTheme() {
    return greenTheme;
}

export function getPrimaryGreyTheme() {
    return greyTheme;
}

export function getPrimaryBlueTheme() {
    return blueTheme;
}

export function getDarkTheme() {
    return darkTheme;
}

export function getGreenWithWhiteBackgroundTheme() {
    return greenWithWhiteBackgroundTheme;
}

export function getDefaultDarkTheme() {
    return defaultDarkTheme;
}
export function getDefaultTheme() {
    return defaultTheme;
}

export function getSubMenuTheme() {
    return subMenuTheme;
}

export function getLightGreyTheme() {
    return lightGreyTheme;
}
