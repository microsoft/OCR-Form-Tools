import {createTheme} from "office-ui-fabric-react";

const greenButtonPalette = {
  themePrimary: "#7bad17",
  themeLighterAlt: "#050701",
  themeLighter: "#141c04",
  themeLight: "#253407",
  themeTertiary: "#4a680e",
  themeSecondary: "#6c9914",
  themeDarkAlt: "#86b627",
  themeDark: "#96c141",
  themeDarker: "#afd16b",
  neutralLighterAlt: "#393e43",
  neutralLighter: "#40454b",
  neutralLight: "#4c5157",
  neutralQuaternaryAlt: "#53585f",
  neutralQuaternary: "#595f65",
  neutralTertiaryAlt: "#73787f",
  neutralTertiary: "#e9ecee",
  neutralSecondary: "#edeff1",
  neutralPrimaryAlt: "#f0f2f4",
  neutralPrimary: "#E0E3E6",
  neutralDark: "#f7f8f9",
  black: "#fbfbfc",
  white: "#32363B",
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
  neutralTertiary: "#f6f6f6",
  neutralSecondary: "#f8f8f8",
  neutralPrimaryAlt: "#f9f9f9",
  neutralPrimary: "#f1f1f1",
  neutralDark: "#fcfcfc",
  black: "#fdfdfd",
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

export function getPrimaryWhiteTheme() {
  return createTheme({palette: whiteButtonPalette});
}

export function getPrimaryRedTheme() {
  return createTheme({palette: redButtonPalette});
}

export function getPrimaryGreenTheme() {
  return createTheme({palette: greenButtonPalette});
}

export function getPrimaryGreyTheme() {
  return createTheme({palette: greyButtonPalette});
}

export function getPrimaryBlueTheme() {
  return createTheme({palette: blueButtonPalette});
}
